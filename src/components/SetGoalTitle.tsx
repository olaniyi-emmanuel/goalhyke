import React from "react";

const SetGoalTitle = () => {
  return (
    <div className="relative w-[230px] h-[65px] flex items-center">
      {/* Blue Circle Background */}
      <div className="absolute top-0 left-0 w-[65px] h-[65px] bg-[#3e6cf4] rounded-full flex items-center justify-center z-0">
         <span className="text-white text-[35px] font-medium font-secondary leading-[41px]">S</span>
      </div>
      
      {/* Text Container - Positioned to overlay/follow correctly */}
      <div className="absolute left-[41px] top-[12px] z-10 flex items-center h-[41px]">
        {/* 'S' is already rendered in background, so we just need 'et a goal' positioned correctly relative to it? 
            Wait, the Figma CSS had both S and 'et a goal' in one container at left: 41px.
            If I put S in the blue circle, and 'et a goal' next to it, I need to align them.
            Let's follow the visual structure:
            Blue Circle at (0,0).
            Text starts at (41, 12).
        */}
        <span className="invisible text-[35px] font-medium font-secondary leading-[41px]">S</span>
        <span className="text-[#262525] text-[35px] font-medium font-secondary leading-[41px] whitespace-nowrap -ml-1">
          et a goal
        </span>
      </div>
    </div>
  );
};

export default SetGoalTitle;
