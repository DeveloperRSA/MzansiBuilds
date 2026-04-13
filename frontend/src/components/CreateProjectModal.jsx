import React from 'react';

export default function CreateProjectModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Card */}
      <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">New <span className="text-mzansi">Project</span></h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">×</button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 ml-1">Title</label>
            <input type="text" placeholder="What are you building?" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-mzansi/50 outline-none transition-all" />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 ml-1">Description</label>
            <textarea placeholder="Describe your build..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 h-32 focus:border-mzansi/50 outline-none transition-all resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 ml-1">Stage</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-gray-400 outline-none">
                <option>Idea</option>
                <option>Building</option>
                <option>Testing</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 ml-1">User ID</label>
              <input type="text" placeholder="123" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-mzansi/50 outline-none transition-all" />
            </div>
          </div>

          <button type="submit" className="w-full bg-mzansi text-black font-bold py-4 rounded-2xl mt-4 hover:shadow-[0_0_20px_rgba(0,223,130,0.4)] transition-all">
            Share to Feed
          </button>
        </form>
      </div>
    </div>
  );
}