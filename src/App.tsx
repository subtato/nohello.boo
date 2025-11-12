import { useMemo, useState, useEffect } from 'react';
import i18n from './i18n/config';
import { ControlsBar } from './components/ControlsBar';
import { ChatExample } from './components/ChatExample';
import { RotatingText } from './components/RotatingText';

function App() {
  // Only subscribe to language changes, not all i18n updates
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Memoize translations to prevent recalculation on every render
  const translations = useMemo(() => ({
    intro: i18n.t('intro'),
    description: i18n.t('description'),
    problemTitle: i18n.t('problem.title'),
    problemDescription: i18n.t('problem.description'),
    solutionTitle: i18n.t('solution.title'),
    solutionDescription: i18n.t('solution.description'),
    examplesTitle: i18n.t('examples.title'),
    badTitle: i18n.t('problem.example.bad.title'),
    goodTitle: i18n.t('problem.example.good.title'),
    footerText: i18n.t('footer.text'),
    footerContribute: i18n.t('footer.contribute'),
    footerGithub: i18n.t('footer.github'),
    badExamples: i18n.t('examples.bad', { returnObjects: true }) as string[],
    goodExamples: i18n.t('examples.good', { returnObjects: true }) as string[],
    benefits: i18n.t('solution.benefits', { returnObjects: true }) as string[],
  }), [currentLanguage]); // Re-compute only when language changes

  return (
    <div className="min-h-screen transition-colors duration-[500ms] ease-in-out" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      <ControlsBar />
      
      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'var(--color-decorative-blue)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'var(--color-decorative-purple)', animationDelay: '1s' }} />
      </div>
      
      <main className="max-w-5xl mx-auto px-4 py-12 md:py-20 pb-24 md:pb-20 relative">
        <header className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 leading-tight flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 text-center">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent whitespace-nowrap font-bold">
              {translations.intro}
            </span>
            <span className="inline-flex items-baseline">
              <RotatingText />
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {translations.description}
          </p>
        </header>

        <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span className="text-5xl">💬</span>
            {translations.problemTitle}
          </h2>
          <p className="text-xl mb-10 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
            {translations.problemDescription}
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <ChatExample type="bad" />
            <ChatExample type="good" />
          </div>
        </section>

        <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span className="text-5xl">✨</span>
            {translations.solutionTitle}
          </h2>
          <p className="text-xl mb-8 text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
            {translations.solutionDescription}
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
            {translations.benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">✓</span>
                  <p className="text-lg text-gray-700 dark:text-gray-300">{benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-4xl md:text-5xl font-bold mb-10 text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span className="text-5xl">📝</span>
            {translations.examplesTitle}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold mb-6 text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="text-3xl">❌</span>
                {translations.badTitle}
              </h3>
              <ul className="space-y-3">
                {translations.badExamples.map((example, index) => (
                  <li
                    key={index}
                    className="p-4 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 rounded-xl border-l-4 border-red-500 shadow-sm hover:shadow-md transition-all duration-200 hover:translate-x-1"
                  >
                    <span className="text-gray-800 dark:text-gray-200 italic">"{example}"</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-bold mb-6 text-green-600 dark:text-green-400 flex items-center gap-2">
                <span className="text-3xl">✅</span>
                {translations.goodTitle}
              </h3>
              <ul className="space-y-3">
                {translations.goodExamples.map((example, index) => (
                  <li
                    key={index}
                    className="p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border-l-4 border-green-500 shadow-sm hover:shadow-md transition-all duration-200 hover:translate-x-1"
                  >
                    <span className="text-gray-800 dark:text-gray-200 italic">"{example}"</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <footer className="mt-20 pt-10 border-t-2 border-gray-200 dark:border-gray-800 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-xl mb-6 text-gray-700 dark:text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed">
            {translations.footerText}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {translations.footerContribute}{' '}
            <a
              href="https://github.com/nohello-net/site"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold underline decoration-2 underline-offset-4 hover:decoration-blue-500 transition-colors duration-200"
            >
              {translations.footerGithub}
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
