'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef, type MouseEvent } from 'react';
import { gsap } from 'gsap';

const capabilities = [
  { number: '01', title: 'Policy-first setup', text: 'Give every agent a model tier, permitted tools, and financial boundaries.', icon: '✦' },
  { number: '02', title: 'Safe execution', text: 'Inspect inputs, redact sensitive data, and pause risky actions automatically.', icon: '⌁' },
  { number: '03', title: 'Decision clarity', text: 'Keep a complete, reviewable trace for each agent request and outcome.', icon: '◌' },
];

const workflow = [
  { href: '/studio', step: '01', title: 'Design the agent', text: 'Set its model, voice, tools, and operating limits.', image: '/images/agentforge-control-plane-hero.png', alt: 'AgentForge orchestration core' },
  { href: '/demo', step: '02', title: 'Test every path', text: 'Run normal, PII, injection, and high-risk examples.', image: '/images/agentforge-guardrails.png', alt: 'Requests moving through safety checks' },
  { href: '/escalation', step: '03', title: 'Approve with context', text: 'Review sensitive actions with the complete decision record.', image: '/images/agentforge-decision-traces.png', alt: 'Explainable AI decision trace' },
];

export default function HomePage() {
  const root = useRef<HTMLElement>(null);
  const artwork = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .from('[data-nav-badge]', { y: -10, autoAlpha: 0, duration: 0.55 })
        .from('[data-hero-copy] > *', { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.72 }, '-=0.2')
        .from('[data-hero-art]', { scale: 0.9, autoAlpha: 0, rotate: 2, duration: 0.9 }, '-=0.65')
        .from('[data-capability]', { y: 22, autoAlpha: 0, stagger: 0.1, duration: 0.55 }, '-=0.3')
        .from('[data-workflow-card]', { y: 28, autoAlpha: 0, stagger: 0.12, duration: 0.6 }, '-=0.15');
      gsap.to('[data-orbit]', { rotate: 360, duration: 22, repeat: -1, ease: 'none' });
      gsap.to('[data-float-one]', { y: -12, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('[data-float-two]', { y: 10, duration: 4.1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, root);
    return () => ctx.revert();
  }, []);

  function tiltArtwork(event: MouseEvent<HTMLDivElement>) {
    if (!artwork.current) return;
    const bounds = artwork.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    gsap.to(artwork.current, { rotateY: x * 7, rotateX: -y * 7, duration: 0.5, ease: 'power2.out' });
  }

  function resetArtwork() {
    if (!artwork.current) return;
    gsap.to(artwork.current, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
  }

  return (
    <main className="experience" ref={root}>
      <section className="experience-hero">
        <div className="experience-copy" data-hero-copy>
          <div className="product-badge" data-nav-badge><span></span> AgentForge control plane</div>
          <h1>Build agents your business can <em>trust.</em></h1>
          <p>Design, test, govern, and explain every AI action from one focused operations workspace.</p>
          <div className="hero-actions">
            <Link className="experience-button experience-button-primary" href="/demo">Try the live console <span>↗</span></Link>
            <Link className="experience-button experience-button-quiet" href="/studio">Explore agent studio</Link>
          </div>
          <div className="trust-row"><span>◉</span> PII protection <span>◉</span> Human review <span>◉</span> Decision traces</div>
        </div>

        <div className="hero-visual-shell" onMouseMove={tiltArtwork} onMouseLeave={resetArtwork}>
          <div className="hero-orbit" data-orbit></div>
          <div className="hero-glow"></div>
          <div className="hero-artwork" ref={artwork} data-hero-art>
            <video autoPlay loop muted playsInline preload="metadata" aria-label="AgentForge robot demonstration">
              <source src="/videos/agentforge-robo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="floating-chip chip-secure" data-float-one><span>✓</span> Guardrails on</div>
          <div className="floating-chip chip-trace" data-float-two><span>◌</span> Full trace</div>
        </div>
      </section>

      <section className="signal-strip" aria-label="AgentForge capabilities">
        <div><strong>99.98%</strong><span>policy adherence</span></div>
        <i></i><div><strong>&lt; 5 min</strong><span>target human review</span></div>
        <i></i><div><strong>100%</strong><span>traceable decisions</span></div>
      </section>

      <section className="experience-section">
        <div className="section-heading"><div><p>Purpose-built controls</p><h2>Keep intelligence moving.<br />Keep risk visible.</h2></div><span>01 — FOUNDATION</span></div>
        <div className="capability-grid">
          {capabilities.map((item) => <article className="capability-card" data-capability key={item.number}><div className="capability-top"><span>{item.number}</span><b>{item.icon}</b></div><h3>{item.title}</h3><p>{item.text}</p><div className="capability-line"></div></article>)}
        </div>
      </section>

      <section className="experience-section workflow-section">
        <div className="section-heading"><div><p>A clearer workflow</p><h2>From configuration<br />to confident action.</h2></div><span>02 — OPERATE</span></div>
        <div className="workflow-grid">
          {workflow.map((item) => <Link className="workflow-card" data-workflow-card href={item.href} key={item.step}>
            <div className="workflow-image"><img src={item.image} alt={item.alt} /><span>{item.step}</span></div>
            <div className="workflow-content"><div><h3>{item.title}</h3><p>{item.text}</p></div><b>↗</b></div>
          </Link>)}
        </div>
      </section>

      <section className="closing-panel">
        <div><p>Ready to operate</p><h2>Make AI actions<br />accountable by default.</h2></div>
        <div><p>Launch a test request and see the guardrails, trace, and approval workflow in action.</p><Link className="experience-button experience-button-light" href="/demo">Open live console <span>↗</span></Link></div>
      </section>
    </main>
  );
}
