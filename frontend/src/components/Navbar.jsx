import React from 'react';

const Navbar = ({ setView, currentView, setOpenModal }) => {
  
  const handleNavigate = (viewName) => {
    setView(viewName);
    setOpenModal(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-white/5 px-8 py-5">
      <div className="max-w-[1440px] mx-auto flex justify-between items-center">
        
        {/* LOGO SECTION - Identical font style to "Developer Feed" */}
        <div 
          className="flex items-center gap-3 cursor-pointer group select-none"
          onClick={() => handleNavigate('feed')}
        >
          {/* Bigger, bolder Icon */}
          <span className="text-5xl font-mono text-mzansi drop-shadow-[0_0_15px_rgba(0,223,130,0.5)] group-hover:rotate-12 transition-transform duration-300">
            {"</>"}
          </span>
          
          {/* Text: Massive, Bold, and Two-Tone */}
          <div className="flex items-center text-5xl md:text-6xl font-[900] tracking-[-0.05em] leading-none italic">
            <span className="text-white">Mzansi</span>
            <span className="text-mzansi ml-1 drop-shadow-[0_0_30px_rgba(0,223,130,0.4)]">Builds</span>
          </div>
        </div>

        {/* Navigation Links - Clean & Bold */}
        <div className="hidden lg:flex items-center gap-8">
          
          <button 
            onClick={() => handleNavigate('feed')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              currentView === 'feed' 
              ? 'bg-mzansi text-black shadow-[0_0_20px_rgba(0,223,130,0.4)]' 
              : 'text-gray-400 hover:text-white'
            }`}
          >
            Feed
          </button>
          
          <button 
            onClick={() => handleNavigate('my-projects')}
            className={`text-sm font-bold transition-all ${
              currentView === 'my-projects' ? 'text-mzansi' : 'text-gray-400 hover:text-white'
            }`}
          >
             My Projects
          </button>
          
          <button 
            onClick={() => handleNavigate('teams')}
            className={`text-sm font-bold border-l border-white/10 pl-8 ${
              currentView === 'teams' ? 'text-mzansi' : 'text-gray-400 hover:text-white'
            }`}
          >
            Collaboration
          </button>
          
          {/* Create Project Styled Button */}
          <button 
            onClick={() => setOpenModal(true)} 
            className="flex items-center gap-2 bg-mzansi/10 border border-mzansi/30 px-5 py-2.5 rounded-2xl hover:bg-mzansi hover:text-black transition-all group"
          >
            <span className="text-xl font-bold">⊕</span>
            <span className="text-sm font-black uppercase tracking-wider">Create</span>
          </button>

          {/* Profile Circle */}
          <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:border-mzansi transition-all cursor-pointer overflow-hidden">
             <span className="text-xl">👤</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;