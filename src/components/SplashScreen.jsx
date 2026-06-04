export default function SplashScreen() {
  return (
    <section className="splash-screen" aria-label="Загрузка приложения">
      <div className="splash-mark">
        <span>ВВ</span>
      </div>
      <div className="splash-copy">
        <h1>Вместе Вкуснее</h1>
        <p>Готовим приложение доставки</p>
      </div>
      <div className="splash-loader" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
