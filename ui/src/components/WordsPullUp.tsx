import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false }: WordsPullUpProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const words = text.split(" ");

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const wordVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        ease: [0.16, 1, 0.3, 1] as any,
        duration: 0.8,
      },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={`inline-flex flex-wrap justify-center ${className}`}
    >
      {words.map((word, wordIdx) => {
        const isLastWord = wordIdx === words.length - 1;

        return (
          <span key={wordIdx} className="inline-block mr-[0.25em] whitespace-nowrap">
            {isLastWord && showAsterisk ? (
              <motion.span
                variants={wordVariants}
                className="inline-block relative"
              >
                {word.length > 0 ? (
                  <span className="relative inline-block">
                    {word.slice(0, -1)}
                    <span className="relative inline-block">
                      {word.slice(-1)}
                      <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em] select-none font-normal">
                        *
                      </span>
                    </span>
                  </span>
                ) : (
                  word
                )}
              </motion.span>
            ) : (
              <motion.span variants={wordVariants} className="inline-block">
                {word}
              </motion.span>
            )}
          </span>
        );
      })}
    </motion.div>
  );
};
