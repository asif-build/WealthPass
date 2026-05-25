import { motion } from "framer-motion";
import { ArrowRight, Mail, Instagram, Twitter, Linkedin } from "lucide-react";
import { WordsPullUp } from "./components/WordsPullUp";
import { AboutSection } from "./components/AboutSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { FamiliesSection } from "./components/FamiliesSection";
import { LegalSection } from "./components/LegalSection";

function App() {
  const navItems = [
    { name: "Security Process", href: "#about" },
    { name: "Families", href: "#families" },
    { name: "Legal Mandate", href: "#legal" },
    { name: "Inquiries", href: "#inquiries" },
  ];

  // Custom ease specified in prompt: [0.16, 1, 0.3, 1]
  const customEase = [0.16, 1, 0.3, 1] as any;

  const fadeUpVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (delay: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        ease: customEase,
        duration: 1,
        delay,
      },
    }),
  };

  return (
    <div className="bg-black text-[#E1E0CC] selection:bg-primary selection:text-black min-h-screen">
      {/* SECTION 1: HERO */}
      <section className="h-screen w-full p-4 md:p-6 relative box-border overflow-hidden">
        <div className="w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden relative border border-white/5">
          {/* Background Video */}
          <video
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* Noise Overlay */}
          <div className="absolute inset-0 noise-overlay opacity-[0.7] mix-blend-overlay pointer-events-none z-10" />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 z-10" />

          {/* Navbar */}
          <nav className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-auto">
            <div className="bg-black rounded-b-2xl md:rounded-b-3xl px-4 py-3 md:px-8 md:py-4 flex items-center justify-center gap-3 sm:gap-6 md:gap-12 lg:gap-14 border-x border-b border-white/5 shadow-2xl">
              {navItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="text-[10px] sm:text-xs md:text-sm font-medium tracking-wider uppercase transition-colors duration-300"
                  style={{
                    color: "rgba(225, 224, 204, 0.8)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#E1E0CC";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(225, 224, 204, 0.8)";
                  }}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </nav>

          {/* Hero Content (bottom-aligned) */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-12 lg:p-16 z-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end w-full max-w-7xl mx-auto">
              
              {/* Giant Heading */}
              <div className="lg:col-span-8 flex flex-col justify-end overflow-visible select-none">
                <WordsPullUp
                  text="WealthPass"
                  showAsterisk={true}
                  className="text-[14vw] sm:text-[13vw] md:text-[11vw] lg:text-[9.5vw] xl:text-[9vw] 2xl:text-[8.5vw] font-medium leading-[0.85] tracking-[-0.07em] text-[#E1E0CC] justify-start"
                />
              </div>

              {/* Description & CTA */}
              <div className="lg:col-span-4 flex flex-col gap-5 sm:gap-6 items-start lg:pb-3">
                <motion.p
                  custom={0.5}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-primary/70 text-xs sm:text-sm md:text-base leading-[1.2] tracking-wide max-w-sm"
                >
                  WealthPass is a secure platform that helps Indian families discover unclaimed assets, navigate the legal recovery path, and obtain bridge-loan support when it matters most.
                </motion.p>

                <motion.a
                  custom={0.7}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  href="/search/"
                  className="group flex items-center gap-2 hover:gap-3 p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-medium transition-all duration-300 text-sm sm:text-base hover:bg-white"
                >
                  <span>Find Assets</span>
                  <div className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                </motion.a>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ABOUT */}
      <AboutSection />

      {/* SECTION 3: FAMILIES */}
      <FamiliesSection />

      {/* SECTION 4: FEATURES */}
      <FeaturesSection />

      {/* SECTION 5: LEGAL MANDATE */}
      <LegalSection />

      {/* SECTION 6: INQUIRIES & FOOTER */}
      <footer id="inquiries" className="bg-[#0c0c0c] border-t border-white/5 py-24 px-4 md:px-6 relative overflow-hidden">
        {/* Soft atmospheric gradient */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
        
        <div className="w-full max-w-7xl mx-auto z-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            
            {/* Left Info Column */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-primary text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-4 block font-medium">
                  Connect
                </span>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#E1E0CC] mb-6 leading-none">
                  Let's secure your family's inheritance.
                </h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-md mb-8">
                  Have a claim, a question, or need assistance recovering family wealth? Reach out to our advisors. We are here to bring closure to your search.
                </p>
              </div>

              {/* Contact details */}
              <div className="flex flex-col gap-4 mt-8">
                <a href="mailto:hello@wealthpass.in" className="flex items-center gap-3 text-[#E1E0CC] hover:text-primary transition-colors text-sm sm:text-base">
                  <Mail className="w-5 h-5" />
                  <span>hello@wealthpass.in</span>
                </a>
                <div className="flex gap-4 mt-4">
                  <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#E1E0CC] hover:border-white/20 transition-all">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#E1E0CC] hover:border-white/20 transition-all">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#E1E0CC] hover:border-white/20 transition-all">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Contact Form Column */}
            <div className="bg-[#121212] p-8 md:p-12 rounded-[2rem] border border-white/5 shadow-2xl">
              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2 font-medium">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-[#E1E0CC] placeholder-gray-600 focus:outline-none focus:border-primary/50 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2 font-medium">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-[#E1E0CC] placeholder-gray-600 focus:outline-none focus:border-primary/50 text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-400 block mb-2 font-medium">Message / Search Inquiry</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us about the policies or assets you are looking to search..."
                    className="w-full bg-[#1c1c1c] border border-white/5 rounded-xl px-4 py-3 text-[#E1E0CC] placeholder-gray-600 focus:outline-none focus:border-primary/50 text-sm transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full group flex items-center justify-between p-1.5 pl-6 pr-1.5 rounded-full bg-primary text-black font-medium transition-all duration-300 text-sm sm:text-base hover:bg-white"
                >
                  <span>Submit Search Inquiry</span>
                  <div className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                </button>
              </form>
            </div>

          </div>

          <div className="border-t border-white/5 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} WealthPass Technologies Pvt. Ltd. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="text-primary/60">RBI Aligned</span>
              <span className="text-primary/60">IRDAI Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
