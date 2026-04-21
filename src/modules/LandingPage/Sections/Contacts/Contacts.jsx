import { useState } from 'react';
import styles from './Contacts.module.scss';
import Button from '../shared/Button/Button';
import MapComponent from './MapComponent/MapComponent';

const Contacts = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Имя обязательно';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Сообщение обязательно';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Сообщение должно содержать минимум 10 символов';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className={styles.contacts}>
      <div className={styles.contacts__container}>
        <header className={styles.contacts__header}>
          <h4 className={styles.contacts__subtitle} aria-hidden="true">
            Контакты
          </h4>
          <h2 className={styles.contacts__title}>Контакты</h2>
        </header>

        <div className={styles.contacts__content}>
          <form onSubmit={handleSubmit} className={styles.contacts__form} noValidate>
            <div className={styles.form__group}>
              <label htmlFor="firstName" className={styles.form__label}>
                Имя <span className={styles.form__required}>*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Ваше имя"
                className={`${styles.form__input} ${errors.firstName ? styles['form__input--error'] : ''}`}
                aria-invalid={errors.firstName ? 'true' : 'false'}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              />
              {errors.firstName && (
                <span id="firstName-error" className={styles.form__error}>
                  {errors.firstName}
                </span>
              )}
            </div>

            <div className={styles.form__group}>
              <label htmlFor="lastName" className={styles.form__label}>
                Фамилия <span className={styles.form__required}>*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Ваша фамилия"
                className={`${styles.form__input} ${errors.lastName ? styles['form__input--error'] : ''}`}
                aria-invalid={errors.lastName ? 'true' : 'false'}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              />
              {errors.lastName && (
                <span id="lastName-error" className={styles.form__error}>
                  {errors.lastName}
                </span>
              )}
            </div>

            <div className={styles.form__group}>
              <label htmlFor="email" className={styles.form__label}>
                Электронная почта <span className={styles.form__required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                className={`${styles.form__input} ${errors.email ? styles['form__input--error'] : ''}`}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <span id="email-error" className={styles.form__error}>
                  {errors.email}
                </span>
              )}
            </div>

            <div className={styles.form__group}>
              <label htmlFor="message" className={styles.form__label}>
                Сообщение <span className={styles.form__required}>*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Ваше сообщение..."
                rows={6}
                className={`${styles.form__textarea} ${errors.message ? styles['form__textarea--error'] : ''}`}
                aria-invalid={errors.message ? 'true' : 'false'}
                aria-describedby={errors.message ? 'message-error' : undefined}
              />
              {errors.message && (
                <span id="message-error" className={styles.form__error}>
                  {errors.message}
                </span>
              )}
            </div>

            <Button 
              type="submit" 
              variant="primary"
              disabled={isSubmitting}
              className={styles.form__submit}
            >
              {isSubmitting ? 'Отправка...' : 'Отправить'}
            </Button>

            {submitStatus === 'success' && (
              <div className={`${styles.form__message} ${styles['form__message--success']}`}>
                ✓ Сообщение успешно отправлено!
              </div>
            )}

            {submitStatus === 'error' && (
              <div className={`${styles.form__message} ${styles['form__message--error']}`}>
                ✗ Произошла ошибка. Попробуйте снова.
              </div>
            )}
          </form>

          <aside className={styles.contacts__info}>
            <div className={styles.contacts__box}>
              <div className={styles.contacts__address}>
                <img src="/location.svg" alt="address" />
                <a href='https://maps.app.goo.gl/vGVRQr67SwyJDGwq5' className={styles['contacts__address--text']}>
                  050020, Республика Казахстан, г.Алматы, Каменское плато, 
                  Садоводческое товарищество «Ионосфера» д.117
                </a>
              </div>
              
              <div className={styles.contacts__address}>
                <img src="/email.svg" alt="email" />
                <a href="mailto:ionos@ionos.kz"className={styles['contacts__address--text']}>
                  ionos@ionos.kz
                </a>
              </div>

              <div className={styles.contacts__map}>
                <MapComponent />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Contacts;