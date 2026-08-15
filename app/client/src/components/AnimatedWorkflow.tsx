import { useEffect, useRef } from 'react';

export default function AnimatedWorkflow() {
    const gridRef = useRef<SVGGElement>(null);

    useEffect(() => {
        if (!gridRef.current) return;
        
        const gridGroup = gridRef.current;
        gridGroup.innerHTML = ''; // Clear strict mode duplicates
        
        const fragment = document.createDocumentFragment();
        const step = 50; 

        for(let x = -3000; x <= 3000; x += step) {
            for(let y = -3000; y <= 3000; y += step) {
                let screenX = (x + y) * 0.707 + 400; 
                let screenY = (-x + y) * 0.424 + 250; 
                
                let dist = Math.sqrt(Math.pow(screenX - 150, 2) + Math.pow(screenY - 400, 2));
                
                let maxRadius = 2.0;
                let fadeDistance = 1500; 
                let r = maxRadius - (dist / fadeDistance * maxRadius);
                
                if (r > 0.2) {
                    let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    circle.setAttribute("cx", screenX.toString());
                    circle.setAttribute("cy", screenY.toString());
                    circle.setAttribute("r", r.toString());
                    
                    let opacity = Math.max(0.1, (r / maxRadius) * 0.45);
                    circle.setAttribute("fill", `rgba(148, 163, 184, ${opacity})`);
                    
                    fragment.appendChild(circle);
                }
            }
        }
        
        gridGroup.appendChild(fragment);
    }, []);

    return (
        <div className="absolute inset-0 flex items-center justify-center -z-10 md:z-0">
            <svg viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[180%] lg:w-[220%] max-w-none h-auto translate-x-6 md:translate-x-12 -translate-y-11 md:-translate-y-22 overflow-visible origin-center">
                <defs>
                    <filter id="shadow-blur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="10" />
                    </filter>
                    <filter id="cord-blur" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" />
                    </filter>

                    <linearGradient id="cord-gradient-green-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="45%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>

                    <linearGradient id="cord2-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0F172A" />
                        <stop offset="20%" stopColor="#1E3A8A" />
                        <stop offset="60%" stopColor="#0284C7" />
                        <stop offset="100%" stopColor="#00E5FF" />
                    </linearGradient>

                    <linearGradient id="cord3-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0F172A" />
                        <stop offset="20%" stopColor="#1E3A8A" />
                        <stop offset="60%" stopColor="#0284C7" />
                        <stop offset="100%" stopColor="#00E5FF" />
                    </linearGradient>

                    <rect id="base" x="-50" y="-50" width="100" height="100" rx="24" transform="scale(1, 0.6) rotate(-45)" />

                    <g id="tile-green">
                        <use href="#base" transform="translate(0, 45)" className="fill-black/20 dark:fill-white/10" filter="url(#shadow-blur)"/>
                        
                        <use href="#base" transform="translate(0, 20)" fill="#064E3B" />
                        <use href="#base" transform="translate(0, 18)" fill="#064E3B" />
                        <use href="#base" transform="translate(0, 16)" fill="#065F46" />
                        <use href="#base" transform="translate(0, 14)" fill="#065F46" />
                        <use href="#base" transform="translate(0, 12)" fill="#047857" />
                        <use href="#base" transform="translate(0, 10)" fill="#047857" />
                        <use href="#base" transform="translate(0, 8)" fill="#059669" />
                        <use href="#base" transform="translate(0, 6)" fill="#059669" />
                        <use href="#base" transform="translate(0, 4)" fill="#10B981" />
                        <use href="#base" transform="translate(0, 2)" fill="#10B981" />
                        
                        <use href="#base" transform="translate(0, 0)" fill="#34D399" />
                        <use href="#base" transform="translate(0, 0)" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
                        
                        <g transform="scale(1, 0.6) rotate(-45)">
                            <circle cx="0" cy="0" r="22" fill="none" stroke="white" strokeWidth="4.5" />
                            <path d="M 0 -10 L 0 0 L 8 4" fill="none" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </g>

                    <g id="tile-blue">
                        <use href="#base" transform="translate(0, 45)" className="fill-black/20 dark:fill-white/10" filter="url(#shadow-blur)"/>
                        
                        <use href="#base" transform="translate(0, 20)" fill="#0C4A6E" />
                        <use href="#base" transform="translate(0, 18)" fill="#0C4A6E" />
                        <use href="#base" transform="translate(0, 16)" fill="#075985" />
                        <use href="#base" transform="translate(0, 14)" fill="#075985" />
                        <use href="#base" transform="translate(0, 12)" fill="#0369A1" />
                        <use href="#base" transform="translate(0, 10)" fill="#0369A1" />
                        <use href="#base" transform="translate(0, 8)" fill="#0284C7" />
                        <use href="#base" transform="translate(0, 6)" fill="#0284C7" />
                        <use href="#base" transform="translate(0, 4)" fill="#0EA5E9" />
                        <use href="#base" transform="translate(0, 2)" fill="#0EA5E9" />
                        
                        <use href="#base" transform="translate(0, 0)" fill="#38BDF8" />
                        <use href="#base" transform="translate(0, 0)" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
                        
                        <g transform="scale(1, 0.6) rotate(-45)">
                            <path fill="white" d="M 6 -18 L -12 2 L -2 2 L -6 18 L 12 -2 L 2 -2 Z" />
                        </g>
                    </g>

                    <path id="cord1" d="M 150 405 C 235 350, 340 305, 360 300" />
                    <path id="cord2" d="M 385 270 C 370 225, 340 170, 365 145 C 385 125, 420 105, 445 95" />
                    <path id="cord3" d="M 345 265 C 400 270, 455 265, 515 290 C 580 305, 600 270, 700 210" />
                </defs>

                {/* Perspective Grid (Static Background) */}
                <g ref={gridRef} id="perspective-grid"></g>

                {/* Animated 3D Elements (Nodes & Cords) */}
                <g className="animate-graphic-in" style={{ animationDelay: '600ms' }}>
                    <g fill="none">
                        <use href="#cord1" stroke="rgba(15,23,42,0.20)" strokeWidth="13" transform="translate(0, 12)" filter="url(#cord-blur)"/>
                        <use href="#cord1" stroke="#083344" strokeWidth="8" strokeLinecap="round"/>
                        <use href="#cord1" stroke="url(#cord-gradient-green-blue)" strokeWidth="5" strokeLinecap="round"/>
                        <use href="#cord1" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round"/>

                        <use href="#cord2" stroke="rgba(15,23,42,0.20)" strokeWidth="13" transform="translate(0, 12)" filter="url(#cord-blur)"/>
                        <use href="#cord2" stroke="#083344" strokeWidth="8" strokeLinecap="round"/>
                        <use href="#cord2" stroke="url(#cord2-gradient)" strokeWidth="5" strokeLinecap="round"/>
                        <use href="#cord2" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round"/>

                        <use href="#cord3" stroke="rgba(15,23,42,0.20)" strokeWidth="13" transform="translate(0, 12)" filter="url(#cord-blur)"/>
                        <use href="#cord3" stroke="#083344" strokeWidth="8" strokeLinecap="round"/>
                        <use href="#cord3" stroke="url(#cord3-gradient)" strokeWidth="5" strokeLinecap="round"/>
                        <use href="#cord3" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round"/>        
                    </g>

                    <use href="#tile-blue" transform="translate(450, 80) scale(0.9)" />
                    <use href="#tile-blue" transform="translate(700, 200) scale(0.9)" />
                    <use href="#tile-blue" transform="translate(350, 280) scale(0.9)" />
                    <use href="#tile-green" transform="translate(150, 400) scale(1.0)" />
                </g>
            </svg>
        </div>
    );
}
