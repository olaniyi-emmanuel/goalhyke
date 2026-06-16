import React from "react";

const SetGoalTitle = () => {
  return (
    <div className="relative flex items-center justify-center h-[65px]">
      {/* Blue Circle Background behind 'S' */}
      <div className="absolute left-[-15px] w-[50px] h-[50px] bg-[#3e6cf4] rounded-full flex items-center justify-center opacity-80 z-0">
      </div>
      
      <h1 className="text-[#262525] text-[35px] font-bold font-secondary relative z-10">
        Set a goal
      </h1>
    </div>
  );
};

export default SetGoalTitle;
