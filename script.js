
document.addEventListener("DOMContentLoaded", () => {
    const timelineLine = document.querySelector('.timeline::after');

    const updateTimelineLine = () => {
        const scrollPosition = window.scrollY;
        const documentHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercentage = (scrollPosition / documentHeight) * 100;
        
        document.documentElement.style.setProperty('--line-height', `${scrollPercentage}%`);
    };

    window.addEventListener("scroll", updateTimelineLine);
});