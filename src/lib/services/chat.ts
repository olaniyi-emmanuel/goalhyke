import { SupabaseClient } from "@supabase/supabase-js";

export interface ChatConversation {
  id: string;
  name: string | null;
  description: string | null;
  type: "dm" | "group";
  creator_id: string | null;
  created_at: string;
  updated_at: string;
  last_message_id: string | null;
  last_message?: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    message_type: string;
  };
  members?: ChatMember[];
  unread_count?: number;
}

export interface ChatMember {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  online_status?: "online" | "offline" | "away";
  last_seen?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "audio" | "video" | "file" | "gif" | "sticker" | "emoji" | "system";
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  sender?: ChatMember;
  reactions?: ChatReaction[];
  read_receipts?: ChatReadReceipt[];
  attachments?: ChatAttachment[];
}

export interface ChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  username?: string;
}

export interface ChatReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface ChatAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

export interface ChatSticker {
  id: string;
  pack_name: string;
  sticker_url: string;
  created_at: string;
}

/**
 * Chat Services Layer for database interactions via Supabase client.
 */
export const ChatService = {
  /**
   * Retrieves conversation list for the active user, including member profiles and last messages.
   */
  async getConversations(supabase: SupabaseClient, userId: string): Promise<ChatConversation[]> {
    // 1. Fetch conversations the user is a member of
    const { data: memberRelations, error: memberErr } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (memberErr) throw memberErr;
    if (!memberRelations || memberRelations.length === 0) return [];

    const conversationIds = memberRelations.map((m) => m.conversation_id);

    // 2. Fetch conversations
    const { data: conversations, error: convsErr } = await supabase
      .from("conversations")
      .select(`
        *,
        last_message:messages!conversations_last_message_id_fkey(
          id,
          content,
          sender_id,
          created_at,
          message_type
        )
      `)
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (convsErr) throw convsErr;
    if (!conversations) return [];

    // 3. Fetch all members for these conversations
    const { data: allMembers, error: membersErr } = await supabase
      .from("conversation_members")
      .select(`
        conversation_id,
        user_id,
        profiles(
          id,
          username,
          full_name,
          avatar_url,
          online_status,
          last_seen
        )
      `)
      .in("conversation_id", conversationIds);

    if (membersErr) throw membersErr;

    // Group members by conversation_id
    const membersMap = new Map<string, ChatMember[]>();
    allMembers?.forEach((relation: any) => {
      const cid = relation.conversation_id;
      const profile = relation.profiles;
      if (profile) {
        const memberObj: ChatMember = {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          online_status: profile.online_status || "offline",
          last_seen: profile.last_seen,
        };
        if (!membersMap.has(cid)) {
          membersMap.set(cid, []);
        }
        membersMap.get(cid)!.push(memberObj);
      }
    });

    // 4. Calculate unread counts
    // Retrieve user's read receipts in these conversations
    const { data: receipts, error: receiptsErr } = await supabase
      .from("read_receipts")
      .select(`
        message_id,
        messages!inner(conversation_id)
      `)
      .eq("user_id", userId)
      .in("messages.conversation_id", conversationIds);

    if (receiptsErr) throw receiptsErr;

    const readMessageIds = new Set(receipts?.map((r) => r.message_id) || []);

    // Get message counts not sent by user
    const { data: messages, error: msgsErr } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id")
      .in("conversation_id", conversationIds)
      .neq("sender_id", userId);

    if (msgsErr) throw msgsErr;

    const unreadCountMap = new Map<string, number>();
    conversationIds.forEach(cid => unreadCountMap.set(cid, 0));
    messages?.forEach((msg) => {
      if (!readMessageIds.has(msg.id)) {
        const currentCount = unreadCountMap.get(msg.conversation_id) || 0;
        unreadCountMap.set(msg.conversation_id, currentCount + 1);
      }
    });

    // Combine data
    return conversations.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      type: c.type,
      creator_id: c.creator_id,
      created_at: c.created_at,
      updated_at: c.updated_at,
      last_message_id: c.last_message_id,
      last_message: c.last_message ? {
        id: c.last_message.id,
        content: c.last_message.content,
        sender_id: c.last_message.sender_id,
        created_at: c.last_message.created_at,
        message_type: c.last_message.message_type,
      } : undefined,
      members: membersMap.get(c.id) || [],
      unread_count: unreadCountMap.get(c.id) || 0,
    }));
  },

  /**
   * Loads message history for a conversation, including attachments, reactions, and receipts.
   */
  async getMessages(
    supabase: SupabaseClient,
    conversationId: string,
    limit = 50,
    offset = 0
  ): Promise<ChatMessage[]> {
    const { data: messages, error: msgsErr } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles(
          id,
          username,
          full_name,
          avatar_url,
          online_status,
          last_seen
        ),
        reactions(
          *,
          profiles(username)
        ),
        read_receipts(*),
        attachments(*)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (msgsErr) throw msgsErr;
    if (!messages) return [];

    return messages.map((m: any) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      message_type: m.message_type,
      parent_id: m.parent_id,
      created_at: m.created_at,
      updated_at: m.updated_at,
      is_edited: m.is_edited,
      is_deleted: m.is_deleted,
      sender: m.sender ? {
        id: m.sender.id,
        username: m.sender.username,
        full_name: m.sender.full_name,
        avatar_url: m.sender.avatar_url,
        online_status: m.sender.online_status || "offline",
        last_seen: m.sender.last_seen,
      } : undefined,
      reactions: m.reactions?.map((r: any) => ({
        id: r.id,
        message_id: r.message_id,
        user_id: r.user_id,
        emoji: r.emoji,
        created_at: r.created_at,
        username: r.profiles?.username,
      })),
      read_receipts: m.read_receipts,
      attachments: m.attachments,
    }));
  },

  /**
   * Fetches or starts a DM with another user.
   */
  async getOrCreateDM(supabase: SupabaseClient, userId: string, buddyId: string): Promise<ChatConversation> {
    // 1. Locate if DM already exists
    const { data: sharedConvs, error: queryErr } = await supabase
      .rpc("get_shared_conversations", { user1: userId, user2: buddyId });

    // If RPC is missing or fails, fall back to javascript mapping
    let existingCid: string | null = null;
    
    if (queryErr || !sharedConvs) {
      // Manual query fallback
      const { data: user1Convs } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", userId);
      const { data: user2Convs } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", buddyId);

      if (user1Convs && user2Convs) {
        const u1Ids = new Set(user1Convs.map(c => c.conversation_id));
        const matchingId = user2Convs.find(c => u1Ids.has(c.conversation_id));
        
        if (matchingId) {
          // Double check conversation type is DM
          const { data: cData } = await supabase
            .from("conversations")
            .select("id, type")
            .eq("id", matchingId.conversation_id)
            .single();
          if (cData && cData.type === "dm") {
            existingCid = cData.id;
          }
        }
      }
    } else if (sharedConvs && sharedConvs.length > 0) {
      existingCid = sharedConvs[0].id;
    }

    if (existingCid) {
      const convList = await this.getConversations(supabase, userId);
      const matched = convList.find(c => c.id === existingCid);
      if (matched) return matched;
    }

    // 2. Create new DM conversation
    const { data: newConv, error: createErr } = await supabase
      .from("conversations")
      .insert({
        type: "dm",
      })
      .select()
      .single();

    if (createErr) throw createErr;

    // 3. Add members
    const { error: membersErr } = await supabase
      .from("conversation_members")
      .insert([
        { conversation_id: newConv.id, user_id: userId, role: "admin" },
        { conversation_id: newConv.id, user_id: buddyId, role: "admin" }
      ]);

    if (membersErr) throw membersErr;

    // Return populated conversation
    const list = await this.getConversations(supabase, userId);
    return list.find(c => c.id === newConv.id)!;
  },

  /**
   * Creates a new Group accountability conversation.
   */
  async createGroup(
    supabase: SupabaseClient,
    name: string,
    description: string | null,
    creatorId: string,
    memberIds: string[]
  ): Promise<ChatConversation> {
    // 1. Create conversation
    const { data: newConv, error: createErr } = await supabase
      .from("conversations")
      .insert({
        name,
        description,
        type: "group",
        creator_id: creatorId
      })
      .select()
      .single();

    if (createErr) throw createErr;

    // 2. Map group members (ensure unique listing)
    const uniqueIds = Array.from(new Set([creatorId, ...memberIds]));
    const membersData = uniqueIds.map(uid => ({
      conversation_id: newConv.id,
      user_id: uid,
      role: uid === creatorId ? "admin" : "member" as "admin" | "member"
    }));

    const { error: membersErr } = await supabase
      .from("conversation_members")
      .insert(membersData);

    if (membersErr) throw membersErr;

    // 3. Insert a system welcome message
    await this.sendMessage(supabase, newConv.id, creatorId, `Welcome to the Group Chat! Let's stay accountable and achieve our goals together.`, "system");

    // Return populated conversation
    const list = await this.getConversations(supabase, creatorId);
    return list.find(c => c.id === newConv.id)!;
  },

  /**
   * Sends a message, adding optional file attachment metadata.
   */
  async sendMessage(
    supabase: SupabaseClient,
    conversationId: string,
    senderId: string,
    content: string,
    messageType: string = "text",
    parentId: string | null = null,
    attachments?: { file_url: string; file_name: string; mime_type: string; file_size: number }[]
  ): Promise<ChatMessage> {
    // 1. Insert message
    const { data: newMsg, error: msgErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        parent_id: parentId,
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // 2. Handle attachments
    if (attachments && attachments.length > 0) {
      const attachData = attachments.map(a => ({
        message_id: newMsg.id,
        file_url: a.file_url,
        file_name: a.file_name,
        mime_type: a.mime_type,
        file_size: a.file_size
      }));

      const { error: attachErr } = await supabase
        .from("attachments")
        .insert(attachData);

      if (attachErr) throw attachErr;
    }

    // 3. Mark message as read by sender automatically
    await supabase
      .from("read_receipts")
      .insert({
        message_id: newMsg.id,
        user_id: senderId,
      })
      .select();

    // 4. Trigger system push notifications for other offline users
    // Retrieve other conversation participants
    const { data: otherMembers } = await supabase
      .from("conversation_members")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .neq("user_id", senderId);

    if (otherMembers && otherMembers.length > 0) {
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", senderId)
        .single();
      const senderName = senderProfile?.full_name || senderProfile?.username || "Someone";

      // Insert notifications for offline members
      const notifs = otherMembers.map(m => ({
        user_id: m.user_id,
        title: messageType === "system" ? "System Event" : `Message from ${senderName}`,
        body: content.length > 80 ? content.substring(0, 77) + "..." : content,
        metadata: { conversation_id: conversationId, sender_id: senderId }
      }));

      await supabase
        .from("notifications")
        .insert(notifs);
    }

    // Fetch populated message object
    const msgs = await this.getMessages(supabase, conversationId, 1, 0);
    return msgs.find(m => m.id === newMsg.id)!;
  },

  /**
   * Toggles emoji reactions on a message.
   */
  async toggleReaction(
    supabase: SupabaseClient,
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    // Check if user reaction already exists
    const { data: existing } = await supabase
      .from("reactions")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing) {
      // Remove it
      await supabase
        .from("reactions")
        .delete()
        .eq("id", existing.id);
    } else {
      // Add it
      await supabase
        .from("reactions")
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji
        });
    }
  },

  /**
   * Marks all messages in a conversation as read by inserting read receipts.
   */
  async markConversationAsRead(
    supabase: SupabaseClient,
    conversationId: string,
    userId: string
  ): Promise<void> {
    // 1. Fetch unread message IDs in this conversation not sent by user
    const { data: unreadMsgs, error: queryErr } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId);

    if (queryErr || !unreadMsgs || unreadMsgs.length === 0) return;

    // Filter out messages that already have a read receipt for this user
    const msgIds = unreadMsgs.map(m => m.id);
    const { data: existingReceipts } = await supabase
      .from("read_receipts")
      .select("message_id")
      .eq("user_id", userId)
      .in("message_id", msgIds);

    const readIds = new Set(existingReceipts?.map(r => r.message_id) || []);
    const pendingIds = msgIds.filter(id => !readIds.has(id));

    if (pendingIds.length === 0) return;

    // 2. Insert read receipts
    const receiptsData = pendingIds.map(mid => ({
      message_id: mid,
      user_id: userId,
    }));

    await supabase
      .from("read_receipts")
      .insert(receiptsData);
  },

  /**
   * Search chat content across messages, attachments, or conversation names.
   */
  async searchChat(
    supabase: SupabaseClient,
    userId: string,
    query: string,
    conversationId?: string
  ): Promise<{
    messages: ChatMessage[];
    attachments: ChatAttachment[];
  }> {
    if (!query.trim()) {
      return { messages: [], attachments: [] };
    }

    // 1. Get user's active conversations
    const { data: memberRelations } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (!memberRelations || memberRelations.length === 0) {
      return { messages: [], attachments: [] };
    }

    const conversationIds = memberRelations.map(m => m.conversation_id);
    const filterIds = conversationId ? [conversationId] : conversationIds;

    // 2. Search messages (Full-text & text match fallback)
    const { data: messages, error: searchErr } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles(
          id,
          username,
          full_name,
          avatar_url,
          online_status,
          last_seen
        ),
        reactions(*),
        attachments(*),
        read_receipts(*)
      `)
      .in("conversation_id", filterIds)
      .textSearch("content", query, { config: "english", type: "plain" })
      .order("created_at", { ascending: false })
      .limit(30);

    // Fallback if full-text search fails or returns nothing
    let searchResults = messages || [];
    if (!messages || messages.length === 0) {
      const { data: fallbackMsgs } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles(
            id,
            username,
            full_name,
            avatar_url,
            online_status,
            last_seen
          ),
          reactions(*),
          attachments(*),
          read_receipts(*)
        `)
        .in("conversation_id", filterIds)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(30);
      searchResults = fallbackMsgs || [];
    }

    // 3. Search attachments
    const { data: attachments } = await supabase
      .from("attachments")
      .select(`
        *,
        messages!inner(conversation_id)
      `)
      .in("messages.conversation_id", filterIds)
      .ilike("file_name", `%${query}%`)
      .limit(30);

    const formattedMsgs: ChatMessage[] = searchResults.map((m: any) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      message_type: m.message_type,
      parent_id: m.parent_id,
      created_at: m.created_at,
      updated_at: m.updated_at,
      is_edited: m.is_edited,
      is_deleted: m.is_deleted,
      sender: m.sender ? {
        id: m.sender.id,
        username: m.sender.username,
        full_name: m.sender.full_name,
        avatar_url: m.sender.avatar_url,
        online_status: m.sender.online_status || "offline",
        last_seen: m.sender.last_seen,
      } : undefined,
      reactions: m.reactions,
      read_receipts: m.read_receipts,
      attachments: m.attachments,
    }));

    return {
      messages: formattedMsgs,
      attachments: attachments || [],
    };
  },

  async updatePresence(
    supabase: SupabaseClient,
    userId: string,
    status: "online" | "offline" | "away"
  ): Promise<void> {
    try {
      await supabase
        .from("profiles")
        .update({
          online_status: status,
          last_seen: timezoneOffsetString(),
        })
        .eq("id", userId);
    } catch (err) {
      console.warn("Failed to update presence:", err);
    }
  }
};

/**
 * Utility helper to generate current ISO timestamp with offset.
 */
function timezoneOffsetString() {
  return new Date().toISOString();
}
