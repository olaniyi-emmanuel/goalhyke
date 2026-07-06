import Image from "next/image";

type FeatureItem = {
  icon: string;
  text: string;
};

const featureItems: FeatureItem[] = [
  { icon: "/images/icon-1.svg", text: "Overcome procrastination" },
  { icon: "/images/icon-2.svg", text: "Get in shape" },
  { icon: "/images/icon-3.svg", text: "Learn a language" },
  { icon: "/images/icon-4.svg", text: "Start meditating" },
  { icon: "/images/icon-5.svg", text: "Advance your career" },
  { icon: "/images/icon-6.svg", text: "Cultivate healthy habits" },
];

const ListItem = ({ icon, text }: FeatureItem) => (
  <div className="flex items-center gap-3 rounded-2xl px-1 py-1.5 sm:gap-4">
    <div className="flex h-[33px] w-[33px] shrink-0 items-center justify-center overflow-hidden rounded-[7px]">
      <Image src={icon} alt="" width={33} height={33} />
    </div>
    <span className="font-secondary text-[16px] leading-[1.45] text-[#262525] sm:text-[18px]">
      {text}
    </span>
  </div>
);

const WhosItFor = () => {
  return (
    <section className="w-full bg-white px-4 py-[24px] sm:px-6 lg:px-0">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-10 overflow-hidden lg:flex-row lg:items-start lg:justify-between lg:gap-8 lg:px-[72px] xl:px-[100px]">
        <div className="w-full max-w-[520px] shrink-0 pt-[12px] sm:pt-[20px] lg:pt-[22px]">
          <h2 className="font-primary text-[32px] font-semibold leading-[1.114] text-[#262525] sm:text-[35px]">
            Who&apos;s it For?
          </h2>

          <p className="mt-[22px] max-w-[481px] font-secondary text-[18px] leading-[1.45] text-[#262525] sm:text-[20px] sm:leading-[1.35]">
            Whether you&apos;re a founder, self-improver, or doer, our
            accountability tool will accelerate your success.
          </p>

          <p className="mt-[44px] font-secondary text-[18px] font-medium leading-[1.45] text-[#262525] sm:text-[20px]">
            goalHyke features are tailored to train you:
          </p>

          <div className="mt-[15px] flex max-w-[460px] flex-col gap-[5px]">
            {featureItems.map((item) => (
              <ListItem key={item.text} {...item} />
            ))}

            <div className="flex items-center gap-3 rounded-2xl px-1 py-1.5 sm:gap-4">
              <div className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-[7px] bg-[#dbe4ff]">
                <div className="flex items-center gap-[3px]">
                  <span className="h-1 w-1 rounded-full bg-[#4169e1]" />
                  <span className="h-1 w-1 rounded-full bg-[#4169e1]" />
                  <span className="h-1 w-1 rounded-full bg-[#4169e1]" />
                </div>
              </div>
              <span className="font-secondary text-[16px] leading-[1.45] text-[#262525] sm:text-[18px]">
                And more...
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full justify-center lg:justify-end">
          <div className="relative w-full max-w-[748px]">
            <div className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden sm:max-w-[620px] lg:max-w-[748px]">
              <div className="absolute inset-0">
                <Image
                  src="/images/whos-it-for-figma.png"
                  alt="Who GoalHyke is for illustration"
                  fill
                  priority
                  className="object-cover object-right"
                  sizes="(min-width: 1024px) 748px, (min-width: 640px) 620px, 520px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhosItFor;
