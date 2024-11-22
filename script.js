class Hero {
    constructor(flightSound, bulletSound, heroSpeed, heroIcon) {
        this.flying = document.querySelector(flightSound);
        this.bullet = document.querySelector(bulletSound);

        this.heroSpeed = heroSpeed;
        this.heroIcon = document.querySelector(heroIcon);

        //* Tone.js MembraneSynth for bullet sound
        this.bulletSound = new Tone.MembraneSynth().toDestination();
        const filter = new Tone.Filter({ frequency: 400, type: "lowpass" }).toDestination();
        this.bulletSound.connect(filter);

        this.collisionSound = new Tone.MembraneSynth().toDestination(); 
        const collisionFilter = new Tone.Filter({ frequency: 150, type: "lowpass" }).toDestination();
        this.collisionSound.connect(collisionFilter);
    }

}

class Asteroid {
    constructor(playSpace) {
        this.playSpace = playSpace;

        //* Create Asteroid Obstacles using DOM
        this.asteroidObstacle = document.createElement("div");
        this.asteroidObstacle.classList.add("asteroid");
        const asteroidImg = document.createElement("img");
        asteroidImg.src = "/asteroid.png";  
        this.asteroidObstacle.appendChild(asteroidImg);

        this.asteroidPosition= this.asteroidObstacle.getBoundingClientRect();


        //* Random position and size for the asteroid
        this.asteroidObstacle.style.left = `${Math.random() * playSpace.clientWidth}px`;
        this.asteroidObstacle.style.top = `-30px`; 
        this.asteroidObstacle.style.width = `${Math.random() * 30 + 30}px`; 
        this.asteroidObstacle.style.height = this.asteroidObstacle.style.width;


        //* Using DOM Add asteroid to play space
        this.playSpace.appendChild(this.asteroidObstacle);

        //* Speed for the asteroid
        this.speed = Math.random() * 2.5 + 1; 
    }

    fall() {
        let currentTop = parseInt(this.asteroidObstacle.style.top);
        
        if (currentTop > window.innerHeight) {
            this.asteroidObstacle.remove(); 
        } else {
            this.asteroidObstacle.style.top = `${currentTop + this.speed}px`;
        }
    }
}

class Game {
    constructor(playSpace, hero) {
        this.playSpace = document.querySelector(playSpace);
        this.hero = hero;

        this.bullet = document.querySelector("#bulletSound");

        //*Hero's initial position and animation
        this.heroLeft = this.playSpace.clientWidth / 2 - this.hero.heroIcon.clientWidth / 2;
        this.heroTop = this.playSpace.clientHeight / 2 - this.hero.heroIcon.clientHeight / 2 + 280;


        //* Empty array for bullets and asteroids
        this.bullets = [];
        this.asteroids = [];


        //* To pause all actions soon as asteroid hits Hero
        this.paused = false; 
        
        
        this.animation();
        this.startAsteroidSpawning(); 
    }

    //* Animation effect
    animation() {
        if (this.paused) return;


        this.hero.heroIcon.style.left = `${this.heroLeft}px`;
        this.hero.heroIcon.style.top = `${this.heroTop}px`;

        gsap.to(this.hero.heroIcon, {
            y: -12,
            duration: 1,
            delay: 0.5,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
        });

        window.addEventListener("keydown", (e) => this.keyPressAction(e));

        this.startGameLoop();
    }

    moveDir({ hs, vs }) {
        const heroRect = this.hero.heroIcon.getBoundingClientRect();
        const playSpaceRect = this.playSpace.getBoundingClientRect();

        if (this.paused) return;

        //* New positions
        let newLeft = this.heroLeft + this.hero.heroSpeed * hs;
        let newTop = this.heroTop + this.hero.heroSpeed * vs;

        //* Horizontal boundaries
        if (newLeft >= 0 && newLeft <= playSpaceRect.width - heroRect.width) {
            this.heroLeft = newLeft;
        }

        //* Vertical boundaries
        if (newTop >= 0 && newTop <= playSpaceRect.height - heroRect.height) {
            this.heroTop = newTop;
        }

        //* Update hero position
        this.hero.heroIcon.style.left = `${this.heroLeft}px`;
        this.hero.heroIcon.style.top = `${this.heroTop}px`;
    }

    fireBullet() {
        if (this.paused) return;

        const bulletFire = document.createElement("div");
        bulletFire.classList.add("bulletFire");

        //* Set bullet initial position based on the hero's position
        bulletFire.style.left = `${this.heroLeft + this.hero.heroIcon.offsetWidth / 2 - 2.5}px`;
        bulletFire.style.top = `${this.heroTop - 10}px`;

        //* Add the bullet to the play div space
        this.playSpace.appendChild(bulletFire);
        this.bullets.push(bulletFire);

        //* Play bullet sound
        this.hero.bulletSound.triggerAttackRelease("C2", "4n");
    }

    bulletsEffect() {

        if (this.paused) return;

        this.bullets.forEach((bulletFire, index) => {
            let bulletTop = parseInt(bulletFire.style.top);

            if (bulletTop <= 0) {

                //* Delete bullet from screen and array

                bulletFire.remove();
                this.bullets.splice(index, 1);

            } else {
                //* Keep moving bullet upwards
                bulletFire.style.top = `${bulletTop - 10}px`;
            }
        });
    }

    dropAsteroids() {
        if (this.paused) return;

        this.asteroids.forEach((asteroid) => {
            asteroid.fall();
        });
    }

    spawnAsteroid() {
        if (this.paused) return;

        const asteroid = new Asteroid(this.playSpace);
        this.asteroids.push(asteroid);
    }

    startAsteroidSpawning() {
        if (this.paused) return;

        setInterval(() => {
            this.spawnAsteroid(); 
        }, 2000);
    }

    checkCollisions() {
        
        this.asteroids.forEach((asteroid, asteroidIndex) => {
            const asteroidRect = asteroid.asteroidObstacle.getBoundingClientRect();
            const heroRect = this.hero.heroIcon.getBoundingClientRect();

            //* Check collision with hero

            if (
                asteroidRect.left < heroRect.left + heroRect.width &&
                asteroidRect.left + asteroidRect.width > heroRect.left &&
                asteroidRect.top < heroRect.top + heroRect.height &&
                asteroidRect.top + asteroidRect.height > heroRect.top
            ) {
                //* Occurence when asteroid hits Hero's Ship
                console.log("You've been hit by an asteroid");
                this.paused = true;
                asteroid.asteroidObstacle.remove();
                this.asteroids.splice(asteroidIndex, 1);
                
                this.hero.collisionSound.triggerAttackRelease("E5", "4n");
            }

            


             //* Occurence when bullet hits asteroid
            this.bullets.forEach((bullet, bulletIndex) => {
                const bulletRect = bullet.getBoundingClientRect();
                if (
                    asteroidRect.left < bulletRect.left + bulletRect.width &&
                    asteroidRect.left + asteroidRect.width > bulletRect.left &&
                    asteroidRect.top < bulletRect.top + bulletRect.height &&
                    asteroidRect.top + asteroidRect.height > bulletRect.top
                ) {

                    //* Occurence when bullet hits asteroid
                    bullet.remove();
                    asteroid.asteroidObstacle.remove();
                    this.bullets.splice(bulletIndex, 1);
                    this.asteroids.splice(asteroidIndex, 1);
                }
            });
        });

    }

    keyPressAction(e) {
        switch (e.keyCode) {
            case 38: // Up arrow
                this.moveDir({ hs: 0, vs: -1 });
                break;
            case 40: // Down arrow
                this.moveDir({ hs: 0, vs: 1 });
                break;
            case 37: // Left arrow
                this.moveDir({ hs: -1, vs: 0 });
                break;
            case 39: // Right arrow
                this.moveDir({ hs: 1, vs: 0 });
                break;
            case 32: // Spacebar for firing bullets
                this.fireBullet();
                break;
        }
    }

startGameLoop() {
        const loop = () => {
            if (this.paused) return;
            else{

            this.bulletsEffect(); 
            this.dropAsteroids(); 
            this.checkCollisions(); 
            requestAnimationFrame(loop); }
        };
        loop();
    }
}

const gameHero = new Hero("#flyingSound", "#bulletSound", 50, "#hero");
const game = new Game("#playSpace", gameHero);