import CreateProjectModal from './components/CreateProjectModal';
import Navbar from './components/Navbar';
import React, { useEffect, useState } from 'react';
import { getCelebrationWall, getFeed } from "./api";
import ProjectCard from "./components/ProjectCard";
import TeamWorkspace from "./components/TeamWorkspace";
import "./App.css";

export default function App() {
  const [feed, setFeed] = useState([]);
  const [celebration, setCelebration] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Navigation & Modal States
  const [view, setView] = useState('feed'); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const [feedData, celebrationData] = await Promise.all([
          getFeed(),
          getCelebrationWall(),
        ]);
        setFeed(feedData);
        setCelebration(celebrationData);
      } catch (error) {
        console.error("Home page request failed", error);
        setErrorMessage("Could not load data right now. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-mzansi/20 border-t-mzansi rounded-full animate-spin mb-4" />
        <p className="text-mzansi font-mono text-sm tracking-widest animate-pulse">INITIATING_WORKSPACE...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-mzansi selection:text-black">
      {/* Fixed Navigation */}
      <Navbar setView={setView} currentView={view} setOpenModal={setIsModalOpen} />
      
      {/* Global Project Creator */}
      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <main className="pt-40 pb-20 px-6 max-w-5xl mx-auto">
        
        {/* VIEW 1: THE PUBLIC FEED */}
        {view === 'feed' && (
          <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-mzansi text-[11px] font-bold mb-10">
              <span className="text-[8px] animate-pulse">●</span> BUILD IN PUBLIC
            </div>

            <h1 className="text-7xl font-extrabold mb-8 tracking-tighter text-white">
              Developer <span className="text-mzansi drop-shadow-[0_0_20px_rgba(0,223,130,0.3)]">Feed</span>
            </h1>
            
            <p className="text-gray-500 text-lg mb-12 max-w-2xl leading-relaxed">
              Explore the latest builds from the community. Share your progress, find collaborators, and ship faster.
            </p>

            {/* NexPrime Search Bar */}
            <div className="w-full max-w-3xl relative mb-12 group">
              <div className="absolute inset-0 bg-mzansi/5 blur-2xl group-hover:bg-mzansi/10 transition-all rounded-full" />
              <input 
                type="text" 
                placeholder="Search projects, developers, or stacks..." 
                className="w-full relative bg-white/5 border border-white/10 rounded-2xl py-5 px-16 text-lg focus:outline-none focus:border-mzansi/50 transition-all placeholder:text-gray-600"
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔍</span>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {['All', 'Idea', 'Planning', 'Building', 'Testing', 'Completed'].map((tag) => (
                <button 
                  key={tag} 
                  className={`px-6 py-2.5 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${
                  tag === 'All' 
                  ? 'bg-mzansi text-black border-mzansi shadow-[0_0_20px_rgba(0,223,130,0.2)]' 
                  : 'border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
                }`}>
                  {tag}
                </button>
              ))}
            </div>

            {errorMessage && <p className="text-red-500 mb-8 font-mono text-sm">{errorMessage}</p>}

            {/* Feed List or Ghost State */}
            <div className="grid gap-6 text-left w-full max-w-4xl">
              {feed.length > 0 ? (
                feed.map(project => <ProjectCard key={project.id} project={project} />)
              ) : (
                <div className="flex flex-col items-center py-24 opacity-60 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl opacity-20">🔍</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No projects found</h3>
                  <p className="text-gray-500 mb-8">Try adjusting your filters or search query.</p>
                  <button 
                    onClick={() => setView('feed')}
                    className="bg-mzansi text-black px-10 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: MY PROJECTS */}
        {view === 'my-projects' && (
          <div className="animate-in fade-in duration-500">
             <h2 className="text-4xl font-bold mb-8">My <span className="text-mzansi">Workspace</span></h2>
             <div className="grid gap-6">
                {/* Dynamically filter for DeveloperRSA based on user demographics */}
                {feed.filter(p => p.owner.username === "DeveloperRSA").length > 0 ? (
                  feed.filter(p => p.owner.username === "DeveloperRSA").map(p => (
                    <ProjectCard key={p.id} project={p} />
                  ))
                ) : (
                  <div className="p-12 border border-white/10 rounded-2xl bg-white/5 text-center">
                    <p className="text-gray-500">You haven't shared any projects yet.</p>
                    <button onClick={() => setIsModalOpen(true)} className="mt-4 text-mzansi font-bold">Post your first build ⊕</button>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* VIEW 3: TEAM COLLABORATION */}
        {view === 'teams' && (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <TeamWorkspace />
          </div>
        )}

        {/* VIEW 4: CELEBRATION WALL */}
        {view === 'wall' && (
          <div className="animate-in zoom-in-95 fade-in duration-500 text-center">
            <h2 className="text-5xl font-black text-white mb-4 italic tracking-tighter">THE SHIPPED <span className="text-mzansi">WALL</span></h2>
            <p className="text-gray-500 mb-16 uppercase tracking-[0.2em] text-xs">Celebrating every successful deployment</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {celebration.map((project) => (
                <div key={project.id} className="group relative p-8 bg-white/[0.03] border border-white/10 rounded-3xl text-left hover:border-mzansi/40 transition-all">
                  <div className="absolute top-6 right-8 text-2xl group-hover:scale-125 transition-transform">🚀</div>
                  <p className="text-mzansi font-mono text-[10px] tracking-widest mb-4">DEPLOYMENT_SUCCESSFUL</p>
                  <h3 className="text-2xl font-bold text-white mb-4 leading-tight">{project.title}</h3>
                  <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                    <div className="w-8 h-8 rounded-full bg-mzansi/20 flex items-center justify-center text-[10px]">👤</div>
                    <p className="text-gray-500 text-sm font-medium">Built by <span className="text-white">@{project.owner.username}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}