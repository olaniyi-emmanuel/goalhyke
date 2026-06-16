import React from "react";
import Image from "next/image";

const testimonials = [
  {
    name: "John Doe",
    goal: "Quit smoking",
    avatar: "/images/avatar-testimonial-1.png",
  },
  {
    name: "John Doe",
    goal: "Quit smoking",
    avatar: "/images/avatar-testimonial-2.png",
  },
  {
    name: "John Doe",
    goal: "Quit smoking",
    avatar: "/images/avatar-testimonial-3.png",
  },
];

const UserTestimonials = () => {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-12">
      {testimonials.map((testimonial, index) => (
        <div key={index} className="relative w-full max-w-[280px]">
          <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-[#262525] font-secondary text-[15px] font-medium">
                {testimonial.name}
              </span>
            </div>
            <p className="text-[#262525] font-secondary text-[15px]">
              {testimonial.goal}
            </p>
          </div>
          {/* Star icon overlay */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[34px] h-[34px] bg-white rounded-full shadow-md border border-gray-50 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="#FACC15"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserTestimonials;
