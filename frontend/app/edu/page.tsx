import React from "react";

interface Module {
  title: string;
  duration: string;
  category: string;
}

const EduModuleCard: React.FC<{ mod: Module }> = ({ mod }) => (
  <div className="card group cursor-pointer hover:border-primary transition-all">
    <div className="aspect-video bg-neutral-page flex items-center justify-center group-hover:bg-primary/5 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <div className="p-6">
      <span className="text-[10px] font-black uppercase text-primary mb-2 inline-block tracking-widest">{mod.category}</span>
      <h3 className="font-black mb-4 leading-tight">{mod.title}</h3>
      <div className="flex items-center justify-between text-[10px] font-bold opacity-40">
        <span>{mod.duration}</span>
        <span className="flex items-center gap-1">
          Start Module
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </div>
  </div>
);

export default function EducationPage() {
  const modules: Module[] = [
    { title: "Spotting Typosquatting", duration: "2 min", category: "Basics" },
    { title: "The Danger of SMS Phishing", duration: "3 min", category: "Mobile" },
    { title: "How MFA Protects You", duration: "2 min", category: "Security" },
    { title: "Secure Browsing Habits", duration: "5 min", category: "Advanced" },
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black mb-4">Security Microlearning</h1>
          <p className="text-secondary-light">Boost your digital literacy with our byte-sized security modules designed for busy individuals.</p>
        </div>
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase opacity-40">Your Progress</p>
            <p className="text-xl font-black text-primary">0 / 4 Modules</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 flex items-center justify-center text-xs font-black text-primary">0%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((mod, idx) => (
          <EduModuleCard key={idx} mod={mod} />
        ))}
      </div>

      <div className="mt-16 bg-secondary text-white p-12 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-black mb-4">Protect Your Account</h2>
          <p className="opacity-70 mb-8">Take the Security Quiz to test your knowledge and receive a personalized security recommendation from our engine.</p>
          <button className="bg-primary hover:bg-primary-dark text-white font-black px-8 py-3 rounded-lg transition-colors">Take the Quiz</button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>
    </div>
  );
}
