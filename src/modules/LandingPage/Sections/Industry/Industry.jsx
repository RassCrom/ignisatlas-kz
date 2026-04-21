import styles from './Industry.module.scss'
import IndustryCard from './IndustryCard/IndustryCard';

const industryData = [
    {
        id: 1,
        title: 'Лесное хозяйство',
        image: '/leshoz.png',
        description: 'Мониторинг лесных пожаров'
    },
    {
        id: 2,
        title: 'Экстренные службы',
        image: '/pozharnaya.png',
        description: 'Быстрое реагирование на возгорания'
    },
    {
        id: 3,
        title: 'Государственные организации',
        image: '/gov.png',
        description: 'Координация противопожарных мер'
    },
    {
        id: 4,
        title: 'Климат',
        image: '/climate.png',
        description: 'Анализ климатических факторов'
    },
    {
        id: 5,
        title: 'Городские службы',
        image: '/city_admin.png',
        description: 'Защита городской инфраструктуры'
    },
    {
        id: 6,
        title: 'Научно-исследовательские институты',
        image: '/nii.png',
        description: 'Исследование динамики пожаров'
    },
];

const Industry = () => {
  return (
    <section id="industries" className={styles.industry}>
      <div className={styles.industry__container}>
        <header className={styles.industry__header}>
            <h4 className={styles.industry__subtitle} aria-hidden="true">
                Отрасли
            </h4>
            <h2 className={styles.industry__title}>Отрасли</h2>
        </header>

        <div className={styles.industry__grid}>
            {industryData.map(industry => (
                <IndustryCard 
                    key={industry.id}
                    {...industry}
                />
            ))}
        </div>
      </div>
    </section>
  );
};

export default Industry;