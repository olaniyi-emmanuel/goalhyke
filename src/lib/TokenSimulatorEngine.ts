/**
 * TokenSimulatorEngine
 * 
 * Simulates user tokens, penalties, recovery bonuses, and liquidations 
 * based on daily check-ins for the GoalHyke accountability application.
 */
export class TokenSimulatorEngine {
  // System Constants
  private readonly INITIAL_TOKENS = 100;
  private readonly MICRO_PENALTY = 20;
  private readonly MACRO_PENALTY = 20;
  private readonly RECOVERY_BONUS = 10;
  private readonly MAX_MICRO_STRIKES = 4;
  private readonly MAX_MACRO_STRIKES = 2;

  // State Variables
  private currentTokens = 100;
  private slushFundPool = 0;
  private microStrikes = 0;
  private macroStrikes = 0;
  private failedLastMicroCheck = false;
  private failedLastMacroCheck = false;

  private dailyHistory: boolean[] = [];
  private dayCount = 0;
  private liquidated = false;

  constructor() {
    this.reset();
  }

  /**
   * Resets the simulator engine to its initial state.
   */
  public reset(): void {
    this.currentTokens = 100;
    this.slushFundPool = 0;
    this.microStrikes = 0;
    this.macroStrikes = 0;
    this.failedLastMicroCheck = false;
    this.failedLastMacroCheck = false;
    this.dailyHistory = [];
    this.dayCount = 0;
    this.liquidated = false;
  }

  /**
   * Processes a single day's check-in status.
   * @param didCheckIn true if the user checked in successfully, false if they failed.
   */
  public processDay(didCheckIn: boolean): void {
    // If the user has already been liquidated, stop evaluation.
    if (this.liquidated) {
      return;
    }

    // Increment day and log history
    this.dayCount++;
    this.dailyHistory.push(didCheckIn);

    // 1. The Micro-Check (Every 3 Days)
    if (this.dayCount % 3 === 0) {
      const lastThreeDays = this.dailyHistory.slice(-3);
      const successCount = lastThreeDays.filter(val => val === true).length;

      if (successCount < 2) {
        this.microStrikes++;
        this.currentTokens = Math.max(0, this.currentTokens - this.MICRO_PENALTY);
        this.slushFundPool += this.MICRO_PENALTY;
        this.failedLastMicroCheck = true;
      } else {
        if (this.failedLastMicroCheck) {
          this.currentTokens = Math.min(this.INITIAL_TOKENS, this.currentTokens + this.RECOVERY_BONUS);
        }
        this.failedLastMicroCheck = false;
      }
      
      // Check liquidation condition immediately
      this.checkLiquidation();
      if (this.liquidated) return;
    }

    // 2. The Macro-Check (Every 7 Days)
    if (this.dayCount % 7 === 0) {
      const lastSevenDays = this.dailyHistory.slice(-7);
      const successCount = lastSevenDays.filter(val => val === true).length;

      if (successCount < 6) {
        this.macroStrikes++;
        this.currentTokens = Math.max(0, this.currentTokens - this.MACRO_PENALTY);
        this.slushFundPool += this.MACRO_PENALTY;
        this.failedLastMacroCheck = true;
      } else {
        if (this.failedLastMacroCheck) {
          this.currentTokens = Math.min(this.INITIAL_TOKENS, this.currentTokens + this.RECOVERY_BONUS);
        }
        this.failedLastMacroCheck = false;
      }

      // Check liquidation condition immediately
      this.checkLiquidation();
      if (this.liquidated) return;
    }

    // 3. Slush Fund Deprecation (Every 30 Days)
    if (this.dayCount % 30 === 0) {
      this.slushFundPool = 0;
    }
  }

  /**
   * Evaluates if liquidation thresholds are met.
   */
  private checkLiquidation(): void {
    if (
      this.microStrikes >= this.MAX_MICRO_STRIKES ||
      this.macroStrikes >= this.MAX_MACRO_STRIKES
    ) {
      this.currentTokens = 0;
      this.liquidated = true;
    }
  }

  // Getters
  public getCurrentTokens(): number {
    return this.currentTokens;
  }

  public getSlushFundPool(): number {
    return this.slushFundPool;
  }

  public getMicroStrikes(): number {
    return this.microStrikes;
  }

  public getMacroStrikes(): number {
    return this.macroStrikes;
  }

  public getFailedLastMicroCheck(): boolean {
    return this.failedLastMicroCheck;
  }

  public getFailedLastMacroCheck(): boolean {
    return this.failedLastMacroCheck;
  }

  public getDayCount(): number {
    return this.dayCount;
  }

  public isLiquidated(): boolean {
    return this.liquidated;
  }

  public getDailyHistory(): boolean[] {
    return [...this.dailyHistory];
  }
}
