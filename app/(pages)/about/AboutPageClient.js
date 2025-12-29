'use client';

import { motion, useInView } from 'framer-motion';
import { Camera, Aperture, Eye, Award, Globe, Sparkles, Calendar, Trophy, ShieldCheck, Users, Zap, ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const AboutPageClient = ({ aboutData }) => {
  
  // Icon mapping function
  const getIcon = (iconName) => {
    const icons = {
      Camera,
      Aperture,
      Eye,
      Award,
      Globe,
      Sparkles,
      Calendar,
      Trophy,
      ShieldCheck,
      Users,
      Zap
    };
    return icons[iconName] || Camera;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 }
    }
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 }
    }
  };

  // Hero Section Component
  const HeroSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
      <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={aboutData.hero.backgroundImage}
            alt="Digicam Market Camera Store"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Content */}
        <motion.div
          className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {aboutData.hero.title}
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl mb-4 font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
          >
            {aboutData.hero.subtitle}
          </motion.p>
          <motion.p
            className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.6 }}
          >
            {aboutData.hero.description}
          </motion.p>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          <div className="w-1 h-8 bg-white opacity-75 mx-auto"></div>
        </motion.div>
      </section>
    );
  };

  // Story Section Component
  const StorySection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
      <section ref={ref} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <motion.div
              variants={slideInLeft}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {aboutData.story.title}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {aboutData.story.subtitle}
              </p>
              <div className="space-y-6">
                {aboutData.story.content.map((paragraph, index) => (
                  <motion.p
                    key={index}
                    className="text-lg text-gray-700 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden shadow-2xl"
              variants={slideInRight}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <Image
                src={"/about.jpeg"}
                alt="Our Story"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
          </div>
        </div>
      </section>
    );
  };


  const ValuesSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
      <section ref={ref} className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {aboutData.mission.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {aboutData.mission.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {aboutData.mission.values.map((value, index) => {
              const IconComponent = getIcon(value.iconName);
              return (
                <motion.div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    );
  };

  // Team Section Component
  // const TeamSection = () => {
  //   const ref = useRef(null);
  //   const isInView = useInView(ref, { once: true });

  //   return (
  //     <section ref={ref} className="py-20 bg-white">
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  //         <motion.div
  //           className="text-center mb-16"
  //           initial={{ opacity: 0, y: 20 }}
  //           animate={isInView ? { opacity: 1, y: 0 } : {}}
  //           transition={{ duration: 0.6 }}
  //         >
  //           <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
  //             {aboutData.team.title}
  //           </h2>
  //           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
  //             {aboutData.team.subtitle}
  //           </p>
  //         </motion.div>

  //         <motion.div
  //           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
  //           variants={containerVariants}
  //           initial="hidden"
  //           animate={isInView ? "visible" : "hidden"}
  //         >
  //           {aboutData.team.members.map((member, index) => (
  //             <motion.div
  //               key={index}
  //               className="group cursor-pointer"
  //               variants={itemVariants}
  //               whileHover={{ y: -10 }}
  //             >
  //               <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
  //                 <div className="relative h-64 overflow-hidden">
  //                   <Image
  //                     src={member.image}
  //                     alt={member.name}
  //                     fill
  //                     className="object-cover group-hover:scale-110 transition-transform duration-300"
  //                     sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  //                   />
  //                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
  //                   {/* Social Links */}
  //                   <div className="absolute bottom-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
  //                     {member.social.linkedin && (
  //                       <a
  //                         href={member.social.linkedin}
  //                         className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
  //                       >
  //                         <Linkedin className="w-4 h-4 text-white" />
  //                       </a>
  //                     )}
  //                     {member.social.instagram && (
  //                       <a
  //                         href={member.social.instagram}
  //                         className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
  //                       >
  //                         <Instagram className="w-4 h-4 text-white" />
  //                       </a>
  //                     )}
  //                     {member.social.twitter && (
  //                       <a
  //                         href={member.social.twitter}
  //                         className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
  //                       >
  //                         <Twitter className="w-4 h-4 text-white" />
  //                       </a>
  //                     )}
  //                   </div>
  //                 </div>
                  
  //                 <div className="p-6">
  //                   <h3 className="text-xl font-semibold text-gray-900 mb-2">
  //                     {member.name}
  //                   </h3>
  //                   <p className="text-blue-600 font-medium mb-3">
  //                     {member.role}
  //                   </p>
  //                   <p className="text-gray-600 text-sm leading-relaxed">
  //                     {member.bio}
  //                   </p>
  //                 </div>
  //               </div>
  //             </motion.div>
  //           ))}
  //         </motion.div>
  //       </div>
  //     </section>
  //   );
  // };

  // Stats Section Component
  const StatsSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
      <section ref={ref} className="py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {aboutData.stats.title}
            </h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              {aboutData.stats.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {aboutData.stats.achievements.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold mb-1">
                  {stat.label}
                </div>
                <div className="text-sm opacity-75">
                  {stat.description}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  };

  // Awards Section Component
  // const AwardsSection = () => {
  //   const ref = useRef(null);
  //   const isInView = useInView(ref, { once: true });

  //   return (
  //     <section ref={ref} className="py-20 bg-gray-50">
  //       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  //         <motion.div
  //           className="text-center mb-16"
  //           initial={{ opacity: 0, y: 20 }}
  //           animate={isInView ? { opacity: 1, y: 0 } : {}}
  //           transition={{ duration: 0.6 }}
  //         >
  //           <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
  //             {aboutData.awards.title}
  //           </h2>
  //           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
  //             {aboutData.awards.subtitle}
  //           </p>
  //         </motion.div>

  //         <motion.div
  //           className="space-y-8"
  //           variants={containerVariants}
  //           initial="hidden"
  //           animate={isInView ? "visible" : "hidden"}
  //         >
  //           {aboutData.awards.awards.map((award, index) => (
  //             <motion.div
  //               key={index}
  //               className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
  //               variants={itemVariants}
  //               whileHover={{ x: 10 }}
  //             >
  //               <div className="flex items-start space-x-6">
  //                 <div className="flex-shrink-0">
  //                   <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
  //                     <Trophy className="w-8 h-8 text-yellow-600" />
  //                   </div>
  //                 </div>
  //                 <div className="flex-1">
  //                   <div className="flex items-center space-x-4 mb-3">
  //                     <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
  //                       {award.year}
  //                     </span>
  //                   </div>
  //                   <h3 className="text-xl font-semibold text-gray-900 mb-2">
  //                     {award.title}
  //                   </h3>
  //                   <p className="text-blue-600 font-medium mb-2">
  //                     {award.organization}
  //                   </p>
  //                   <p className="text-gray-600">
  //                     {award.description}
  //                   </p>
  //                 </div>
  //               </div>
  //             </motion.div>
  //           ))}
  //         </motion.div>
  //       </div>
  //     </section>
  //   );
  // };

  // CTA Section Component
  const CTASection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
      <section ref={ref} className="py-20  ">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {aboutData.cta.title}
            </h2>
            <p className="text-xl mb-4 opacity-90">
              {aboutData.cta.subtitle}
            </p>
            <p className="text-lg mb-10 opacity-75 max-w-2xl mx-auto">
              {aboutData.cta.description}
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={aboutData.cta.buttonLink}
                className="inline-flex items-center space-x-2 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors duration-300"
              >
                <span>{aboutData.cta.buttonText}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen">
      <HeroSection />
      <StorySection />
      <ValuesSection />
      {/* <TeamSection /> */}
      <StatsSection />
      {/* <AwardsSection /> */}
      <CTASection />
    </div>
  );
};

export default AboutPageClient;