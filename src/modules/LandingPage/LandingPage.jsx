import styles from "./LandingPage.module.scss";
import Contacts from "./Sections/Contacts/Contacts";
import Footer from "./Sections/Footer/Footer";
import Header from "./Sections/Header/Header";
import Hero from "./Sections/Hero/Hero";
import Industry from "./Sections/Industry/Industry";
import Products from "./Sections/Products/Products";

const LandingPage = () => {
    return(
        <div className={styles.landing}>
            <Header />
            <Hero />
            <main className={styles.main}>
                <Products />
                <Industry />
                <Contacts />
            </main>
            <Footer />
        </div>
    )
}

export default LandingPage;