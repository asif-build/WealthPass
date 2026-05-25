import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface TextSegment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: TextSegment[];
  className?: string;
}

export const WordsPullUpMultiStyle = ({ segments, className = "" }: WordsPullUpMultiStyleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  // Flat map all segments to individual words with their respective styles
  // We filter out empty strings in case of double spaces
  const words = segments.flatMap((segment) => {
    return segment.text.split(" ").filter(w => w !== "").map((word) => ({
      word,
      className: segment.className || "",
    }));
  });

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
      {words.map((item, idx) => (
        <span key={idx} className="inline-block mr-[0.25em] whitespace-nowrap">
          <motion.span
            variants={wordVariants}
            className={`inline-block ${item.className}`}
          >
            {item.word}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
};
