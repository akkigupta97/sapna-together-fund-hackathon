import { Button } from "@/components/ui/button";
import { getChronotypeDescription } from "@/lib/sleep-utils";

export default function OnboardingComplete({ 
  sleepProfile, 
  chronotype, 
  onFinish 
}: { 
  sleepProfile: any; 
  chronotype: any; 
  onFinish: () => void; 
}) {
  const chronoInfo = chronotype ? getChronotypeDescription(chronotype.type) : null;
  
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🌙</span>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-4">Setup Complete!</h2>
      <p className="text-gray-300 max-w-md mx-auto mb-8">
        Your personalized sleep profile is ready. We've created a sleep plan tailored to your needs.
      </p>
      
      {chronoInfo && (
        <div className="glass-card p-6 rounded-xl mb-8 text-left">
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${chronoInfo.color} flex items-center justify-center mr-4`}>
              <span className="text-xl">{chronoInfo.emoji}</span>
            </div>
            <div>
              <h3 className="font-bold text-white">Your Chronotype</h3>
              <p className="text-gray-300">{chronoInfo.title}</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm">{chronoInfo.description}</p>
        </div>
      )}
      
      <div className="glass-card p-6 rounded-xl mb-8 text-left">
        <h3 className="font-bold text-white mb-3">Your Sleep Profile</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-300">Bedtime</span>
            <span className="text-white">{sleepProfile?.bedtime || '--:--'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Wake Time</span>
            <span className="text-white">{sleepProfile?.wakeTime || '--:--'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Sleep Duration</span>
            <span className="text-white">{sleepProfile?.preferredDuration ? `${Math.floor(sleepProfile.preferredDuration/60)}h` : '--'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Sound Preferences</span>
            <span className="text-white">
              {sleepProfile?.soundPreferences?.slice(0, 2).join(', ') || 'None'}
              {sleepProfile?.soundPreferences?.length > 2 ? '...' : ''}
            </span>
          </div>
        </div>
      </div>
      
      <Button 
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
        onClick={onFinish}
      >
        Start Using Sapna
      </Button>
    </div>
  );
}
