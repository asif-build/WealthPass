import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { WordsPullUpMultiStyle } from "./WordsPullUpMultiStyle";

interface AnimatedLetterProps {
  char: string;
  progress: any;
  range: [number, number];
}

const AnimatedLetter = ({ char, progress, range }: AnimatedLetterProps) => {
  // Clamp range to [0, 1] to keep interpolation within boundaries
  const start = Math.max(0, Math.min(1, range[0]));
  const end = Math.max(0, Math.min(1, range[1]));
  const adjustedRange = (start >= end ? [start, start + 0.01] : [start, end]) as [number, number];

  const opacity = useTransform(progress, adjustedRange, [0.2, 1]);

  return (
    <motion.span style={{ opacity }} className="char-span">
      {char}
    </motion.span>
  );
};

export const AboutSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hook scroll progress targeting this container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.2"],
  });

  const headingSegments = [
    { text: "We are WealthPass, ", className: "font-normal text-[#E1E0CC]" },
    { text: "a secure platform. ", className: "italic font-serif text-primary" },
    { text: "We help nominees and legal heirs claim unclaimed assets.", className: "font-normal text-[#E1E0CC]" },
  ];

  const bodyText =
    "Over the last seven years, unclaimed wealth in India has grown to over one lakh crore. We partner with regulated financial institutions, legal experts, and families to bring closure and security to your financial inheritance.";

  const characters = bodyText.split("");

  return (
    <section id="about" className="py-20 md:py-32 px-4 md:px-6 bg-black flex justify-center items-center">
      <div className="w-full max-w-6xl bg-[#101010] rounded-[2rem] p-8 sm:p-12 md:p-20 text-center flex flex-col items-center justify-center border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Subtle accent light inside card */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[200px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <span className="text-primary text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-6 sm:mb-8 font-medium">
          Asset recovery
        </span>

        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl max-w-4xl leading-[1.05] sm:leading-[1] tracking-[-0.03em] mb-10 sm:mb-14">
          <WordsPullUpMultiStyle segments={headingSegments} />
        </h2>

        <div ref={containerRef} className="max-w-3xl text-[#DEDBC8] text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed md:leading-loose tracking-wide">
          {characters.map((char, index) => {
            const charProgress = index / characters.length;
            const range: [number, number] = [charProgress - 0.1, charProgress + 0.05];
            
            return (
              <AnimatedLetter
                key={index}
                char={char}
                progress={scrollYProgress}
                range={range}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
