import { useState } from 'react';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { MomentumChart } from './components/MomentumChart';
import { TacticalBoard } from './components/TacticalBoard';
import { VARCenter } from './components/VARCenter';
import { AIAnalyst } from './components/AIAnalyst';
import { Predictor } from './components/Predictor';
import './index.css';

function App() {
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F19] text-gray-100 pb-12">
      {/* Premium Header */}
      <Header
        currentMinute={currentMinute}
        setCurrentMinute={setCurrentMinute}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      <main className="max-w-[1600px] w-full mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Timeline Slider at the top */}
        <div className="w-full">
          <Timeline
            currentMinute={currentMinute}
            setCurrentMinute={setCurrentMinute}
          />
        </div>

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Left Column - Live Stats & Playboard */}
          <div className="flex flex-col gap-6">
            <MomentumChart currentMinute={currentMinute} />
            <TacticalBoard currentMinute={currentMinute} />
          </div>

          {/* Right Column - Decision & Chat Intelligence */}
          <div className="flex flex-col gap-6">
            <Predictor currentMinute={currentMinute} />
            <VARCenter currentMinute={currentMinute} />
            <AIAnalyst currentMinute={currentMinute} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
