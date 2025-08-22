// MiniRust Compiler Homepage JavaScript

// Copy to clipboard functionality
function copyToClipboard(button) {
    const codeElement = button.previousElementSibling;
    const text = codeElement.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = 'var(--primary-green)';
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const headerOffset = 80;
                const elementPosition = targetSection.offsetTop;
                const offsetPosition = elementPosition - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Parallax effect for stars
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    const starsLayers = document.querySelectorAll('.stars-layer-1, .stars-layer-2, .stars-layer-3');
    starsLayers.forEach((layer, index) => {
        const speed = (index + 1) * 0.3;
        layer.style.transform = `translateX(${rate * speed}px)`;
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections for animations
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section-header, .feature-card, .step-card, .why-use-text');
    sections.forEach(section => {
        observer.observe(section);
    });
});

// Add dynamic glow effect to feature cards
document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 0 40px rgba(0, 255, 136, 0.4)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '';
        });
    });
});

// Animate compilation flow steps
document.addEventListener('DOMContentLoaded', () => {
    const flowSteps = document.querySelectorAll('.flow-step');
    let currentStep = 0;
    
    function animateSteps() {
        // Remove active class from all steps
        flowSteps.forEach(step => step.classList.remove('active'));
        
        // Add active class to current step
        flowSteps[currentStep].classList.add('active');
        
        // Move to next step
        currentStep = (currentStep + 1) % flowSteps.length;
    }
    
    // Start animation
    setInterval(animateSteps, 2000);
});

// Add typing animation to hero title
document.addEventListener('DOMContentLoaded', () => {
    const titleLines = document.querySelectorAll('.title-line');
    
    titleLines.forEach((line, index) => {
        line.style.opacity = '0';
        line.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            line.style.transition = 'all 0.8s ease';
            line.style.opacity = '1';
            line.style.transform = 'translateY(0)';
        }, index * 300);
    });
});

// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelector('.nav-links');
    
    // Create mobile menu toggle button if screen is small
    if (window.innerWidth <= 768) {
        const mobileToggle = document.createElement('button');
        mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
        mobileToggle.className = 'mobile-toggle';
        mobileToggle.style.cssText = `
            background: none;
            border: none;
            color: var(--star-white);
            font-size: 20px;
            cursor: pointer;
            display: none;
        `;
        
        const navContainer = document.querySelector('.nav-container');
        navContainer.appendChild(mobileToggle);
        
        // Show/hide mobile menu
        if (window.innerWidth <= 768) {
            mobileToggle.style.display = 'block';
            navLinks.style.display = 'none';
            
            mobileToggle.addEventListener('click', () => {
                if (navLinks.style.display === 'none') {
                    navLinks.style.display = 'flex';
                    navLinks.style.flexDirection = 'column';
                    navLinks.style.position = 'absolute';
                    navLinks.style.top = '100%';
                    navLinks.style.left = '0';
                    navLinks.style.right = '0';
                    navLinks.style.background = 'var(--deep-space)';
                    navLinks.style.padding = 'var(--spacing-lg)';
                    navLinks.style.borderTop = '1px solid rgba(0, 255, 136, 0.2)';
                } else {
                    navLinks.style.display = 'none';
                }
            });
        }
    }
});

// Add smooth hover effects to buttons
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
});