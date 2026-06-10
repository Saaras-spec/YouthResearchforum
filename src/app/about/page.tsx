import React from "react";
import { Metadata } from "next";
import { Quote } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Youth Research Forum",
  description: "Learn about the Youth Research Forum (YRF) at Kalindi College, University of Delhi—a student-led intellectual collective cultivating the next generation of policy-conscious citizens.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-16 bg-editorial-cream font-sans">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Editorial Heading */}
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#c39a5b] font-bold">
            Youth Research Forum
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-editorial-charcoal">
            About Us
          </h1>
          <p className="text-md sm:text-lg text-editorial-gray max-w-xl mx-auto font-light leading-relaxed pt-2">
            Kalindi College, University of Delhi
          </p>
        </div>

        {/* Content Body */}
        <div className="prose prose-lg mx-auto text-editorial-charcoal leading-relaxed space-y-10">
          
          {/* Who We Are */}
          <section className="space-y-4 border-b border-[#e6e2da] pb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-editorial-charcoal">
              Who We Are
            </h2>
            <p className="font-light text-base sm:text-lg text-editorial-gray">
              The Youth Research Forum (YRF) is a student-led intellectual collective rooted at Kalindi College, University of Delhi, dedicated to cultivating the next generation of informed, engaged, and policy-conscious citizens. We are a space where curiosity meets commitment — where young minds do not merely observe the world, but seek to understand and shape it.
            </p>
            <p className="font-light text-base sm:text-lg text-editorial-gray">
              At YRF, we believe that research is not a solitary pursuit confined to libraries, but a living, breathing practice that thrives in conversation, collaboration, and action. Our members explore the full spectrum of national and international issues — legal, social, economic, and political — through rigorous research, open dialogue, and meaningful engagement with the world beyond the classroom.
            </p>
          </section>

          {/* What We Do */}
          <section className="space-y-4 border-b border-[#e6e2da] pb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-editorial-charcoal">
              What We Do
            </h2>
            <p className="font-light text-base sm:text-lg text-editorial-gray">
              Our work spans a wide range of platforms and experiences. Members contribute to research publications, author blogs and policy papers, and participate in podcast interviews with subject-matter experts. We represent our institution at Model United Nations conferences, attend Youth Parliaments, and have had the privilege of visiting embassies and engaging with diplomats — experiences that bring the abstract firmly into the real.
            </p>
            
            {/* Callout Quote */}
            <div className="bg-editorial-cream-dark/30 border-l-4 border-editorial-accent p-6 sm:p-8 my-8 rounded-sm">
              <Quote className="h-8 w-8 text-editorial-accent opacity-50 mb-3" />
              <p className="font-serif italic text-lg sm:text-xl text-editorial-charcoal leading-relaxed">
                "We do not simply study policy. We participate in making the conversations around it."
              </p>
            </div>
          </section>

          {/* Why We Exist */}
          <section className="space-y-4 border-b border-[#e6e2da] pb-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-editorial-charcoal">
              Why We Exist
            </h2>
            <p className="font-light text-base sm:text-lg text-editorial-gray">
              In an era of information abundance and civic disengagement, YRF exists to bridge the gap between academic learning and active citizenship. We provide our members not only with knowledge, but with the confidence, networks, and platforms to apply it. Whether it is standing before a Model UN committee, publishing a piece of research, or sitting across from a diplomat — YRF prepares its members for rooms that matter.
            </p>
          </section>

          {/* Join Us */}
          <section className="space-y-4 pt-4 text-center">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-editorial-charcoal">
              Join Us
            </h2>
            <p className="font-light text-base text-editorial-gray max-w-2xl mx-auto leading-relaxed">
              We welcome students who are curious, driven, and unafraid to engage with complexity. If you believe that young people have a role to play in the conversations shaping our world — you belong here.
            </p>
            <div className="pt-6">
              <a
                href="/signup"
                className="inline-block px-6 py-3.5 bg-editorial-charcoal hover:bg-editorial-accent text-white uppercase text-xs tracking-widest font-bold transition-all rounded-sm"
              >
                Join YRF
              </a>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
