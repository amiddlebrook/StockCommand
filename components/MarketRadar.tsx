import React, { useEffect, useRef } from 'react';

interface RadarBlip {
    angle: number;
    distance: number;
    intensity: number;
    label: string;
    color: string;
}

interface MarketRadarProps {
    blips?: RadarBlip[];
    isScanning?: boolean;
    size?: number;
}

export const MarketRadar: React.FC<MarketRadarProps> = ({
    blips = [],
    isScanning = true,
    size = 280
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sweepAngleRef = useRef(0);
    const animationRef = useRef<number>();

    // Default market regime blips if none provided
    const defaultBlips: RadarBlip[] = [
        { angle: 45, distance: 0.6, intensity: 0.8, label: 'VIX', color: '#22c55e' },
        { angle: 120, distance: 0.4, intensity: 0.6, label: 'SPY', color: '#06b6d4' },
        { angle: 200, distance: 0.7, intensity: 0.9, label: 'AAPL', color: '#f59e0b' },
        { angle: 280, distance: 0.3, intensity: 0.5, label: 'QQQ', color: '#8b5cf6' },
        { angle: 330, distance: 0.5, intensity: 0.7, label: 'BTC', color: '#ef4444' },
    ];

    const activeBlips = blips.length > 0 ? blips : defaultBlips;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = size / 2;
        const centerY = size / 2;
        const maxRadius = size / 2 - 20;

        const draw = () => {
            // Clear canvas
            ctx.clearRect(0, 0, size, size);

            // Draw concentric circles (radar rings)
            for (let i = 1; i <= 4; i++) {
                const radius = (maxRadius / 4) * i;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 + i * 0.05})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Draw cross lines
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - maxRadius);
            ctx.lineTo(centerX, centerY + maxRadius);
            ctx.moveTo(centerX - maxRadius, centerY);
            ctx.lineTo(centerX + maxRadius, centerY);
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
            ctx.stroke();

            // Draw sweep line with gradient
            if (isScanning) {
                const sweepLength = maxRadius;
                const sweepX = centerX + Math.cos(sweepAngleRef.current) * sweepLength;
                const sweepY = centerY + Math.sin(sweepAngleRef.current) * sweepLength;

                // Sweep trail (fade effect)
                for (let i = 0; i < 30; i++) {
                    const trailAngle = sweepAngleRef.current - (i * 0.02);
                    const trailX = centerX + Math.cos(trailAngle) * sweepLength;
                    const trailY = centerY + Math.sin(trailAngle) * sweepLength;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(trailX, trailY);
                    ctx.strokeStyle = `rgba(6, 182, 212, ${0.3 - i * 0.01})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Main sweep line
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(sweepX, sweepY);
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Draw blips
            activeBlips.forEach((blip) => {
                const blipAngle = (blip.angle * Math.PI) / 180;
                const blipRadius = blip.distance * maxRadius;
                const blipX = centerX + Math.cos(blipAngle) * blipRadius;
                const blipY = centerY + Math.sin(blipAngle) * blipRadius;

                // Glow effect
                const gradient = ctx.createRadialGradient(blipX, blipY, 0, blipX, blipY, 12);
                gradient.addColorStop(0, blip.color);
                gradient.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(blipX, blipY, 12, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(blipX, blipY, 4, 0, Math.PI * 2);
                ctx.fillStyle = blip.color;
                ctx.fill();

                // Label
                ctx.font = '10px IBM Plex Mono';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.textAlign = 'center';
                ctx.fillText(blip.label, blipX, blipY - 14);
            });

            // Center dot
            ctx.beginPath();
            ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#06b6d4';
            ctx.fill();

            // Update sweep angle
            if (isScanning) {
                sweepAngleRef.current += 0.02;
                if (sweepAngleRef.current > Math.PI * 2) {
                    sweepAngleRef.current = 0;
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [size, isScanning, activeBlips]);

    return (
        <div className="glass-panel hud-brackets rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-xs text-cyan-400 font-medium tracking-wider">MARKET RADAR</span>
                </div>
                <span className="text-xs text-slate-500">LIVE</span>
            </div>
            <div className="flex justify-center">
                <canvas
                    ref={canvasRef}
                    width={size}
                    height={size}
                    className="opacity-90"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.3))' }}
                />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                {activeBlips.slice(0, 5).map((blip, i) => (
                    <div key={i} className="text-xs">
                        <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: blip.color }} />
                        <span className="text-slate-400">{blip.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketRadar;
