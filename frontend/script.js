
const tools = {
    randColor: () => {
        return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    },
    /**
     * 
     * @returns {string} Hex color
     */
    randFullSaturationColor: () => {
        const h = Math.floor(Math.random() * 360);
        const s = 1;
        const l = 0.5;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r, g, b;
        if (h < 60) {
            [r, g, b] = [c, x, 0];
        } else if (h < 120) {
            [r, g, b] = [x, c, 0];
        } else if (h < 180) {
            [r, g, b] = [0, c, x];
        } else if (h < 240) {
            [r, g, b] = [0, x, c];
        }  else if (h < 300) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }
        r = Math.floor((r + m) * 255).toString(16).padStart(2, '0');
        g = Math.floor((g + m) * 255).toString(16).padStart(2, '0');
        b = Math.floor((b + m) * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    },
    lerpColor: (a, b, amount) => {
        const ah = parseInt(a.replace(/#/g, ''), 16),
            ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
            bh = parseInt(b.replace(/#/g, ''), 16),
            br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
            rr = ar + amount * (br - ar),
            rg = ag + amount * (bg - ag),
            rb = ab + amount * (bb - ab);
        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1);
    },
    rantInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}


class Food {
    constructor(x, y, mass=1) {
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.color = tools.randFullSaturationColor();
    }

    draw(ctx, X, Y, S) {
        // Draw a circle
        const radius = Math.sqrt(this.mass);
        ctx.beginPath();
        ctx.arc(X(this.x), Y(this.y), S(radius), 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}


class Player {
    constructor(name, id=Math.random(), mass=10, x=0, y=0) {
        this.name = name;
        this.id = id;
        this.mass = mass;
        this.x = x;
        this.y = y;
        this.velX = 0;
        this.velY = 0;
        this.score = 0;
        this.color = tools.randFullSaturationColor();
        this.outline = tools.lerpColor(this.color, '#000000', 0.1);
        this.direction = 0;
        this.speed = 0;
    }

    getMaxSpeed() {
        return (1/this.mass) * 3;
    }

    draw(ctx, X, Y, S) {
        // Movement
        const gotoVelX = Math.cos(this.direction) * this.speed;
        const gotoVelY = Math.sin(this.direction) * this.speed;
        this.velX += (gotoVelX - this.velX) * 0.25;
        this.velY += (gotoVelY - this.velY) * 0.25;
        this.x += this.velX;
        this.y += this.velY;

        // Draw a circle
        const radius = Math.sqrt(this.mass / Math.PI);
        ctx.beginPath();
        ctx.arc(X(this.x), Y(this.y), S(radius), 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = S(radius * 0.05);
        ctx.strokeStyle = this.outline;
        ctx.stroke();
        ctx.font = `${S(1)}px Arial`;
        ctx.fillStyle = '#000';
        ctx.fillText(this.name, X(this.x) - S(1), Y(this.y) - S(1));
    }
}

class GameManager {
    constructor() {
        this.you = null;
        this.players = [];
        this.food = [];
        this.mouse = {x: 0, y: 0, out: false};
        this.cam = {x: 0, y: 0, zoom: 20};
        this.keys = {};
        this.socket = new WebSocket('ws://localhost:3001');
    }

    init(canvasContext, isDebug=true) {
        this.ctx = canvasContext;
        const yourName = document.getElementById('name').value;
        this.you = new Player(yourName);
        this.players.push(this.you);
        if (isDebug) {
            // Scatter food everywhere from -1000 to 1000
            const span = 400;
            for (let i = 0; i < 1000; i++) {
                this.food.push(new Food(tools.rantInt(-span, span), tools.rantInt(-span, span)));
            }
            
        }
    }
    handleKeyDown(e) {
        this.keys[e.key] = true;
    }
    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
    updateMouse(e) {
        this.mouse = {x: e.clientX, y: e.clientY, out: false};
    }
    handleWheel(e) {
        const zoomPower = (e.deltaY > 0) ? 0.9 : 1.1;
        this.cam.zoom *= zoomPower;
    }
    handleMouseOut() {
        this.mouse.out = true;
    }




    X(pos) { // Convert x position to screen position
        return (pos - this.cam.x) * this.cam.zoom + innerWidth / 2;
    }
    Y(pos) { // Convert y position to screen position
        return (pos - this.cam.y) * this.cam.zoom + innerHeight / 2;
    }
    S(pos) { // Convert size to screen size
        return pos * this.cam.zoom;
    }
    RevX(pos) { // Convert screen position to x position
        return (pos - innerWidth / 2) / this.cam.zoom + this.cam.x;
    }
    RevY(pos) { // Convert screen position to y position
        return (pos - innerHeight / 2) / this.cam.zoom + this.cam.y;
    }
    RevS(pos) { // Convert screen size to size
        return pos / this.cam.zoom
    }


    draw() {

        // Update logic -> keys
        if (this.mouse.out) {
            this.you.speed *= 0.9;
        } else {
            let cx = 0, cy = 0;
            if (this.keys['w'] || this.keys['ArrowUp']) cy = -1;
            if (this.keys['s'] || this.keys['ArrowDown']) cy = 1;
            if (this.keys['a'] || this.keys['ArrowLeft']) cx = -1;
            if (this.keys['d'] || this.keys['ArrowRight']) cx = 1;
            if (cx || cy) {
                this.you.direction = Math.atan2(cy, cx);
                this.you.speed = this.you.getMaxSpeed();
            } else {
                // Mouse controls
                const dx = this.mouse.x - this.X(this.you.x);
                const dy = this.mouse.y - this.Y(this.you.y);
                const mouseDistanceRatio = Math.sqrt(dx * dx + dy * dy) / Math.min(innerWidth, innerHeight) * 4; // Reach from half the screen
                this.you.direction = Math.atan2(dy, dx);
                if (mouseDistanceRatio < 0.1) {
                    this.you.speed = 0;
                } else {
                    this.you.speed = this.you.getMaxSpeed() * Math.min(1, mouseDistanceRatio);
                }
            }
        }

        // Update logic -> camera
        this.cam.x = this.you.x;
        this.cam.y = this.you.y;


        // Draw logic
        this.ctx.clearRect(0, 0, innerWidth, innerHeight);
        this.ctx.fillStyle = '#eee'
        this.ctx.fillRect(0, 0, innerWidth, innerHeight);
        for (const f of this.food) {
            f.draw(this.ctx, this.X.bind(this), this.Y.bind(this), this.S.bind(this));
        }
        for (const p of this.players) {
            p.draw(this.ctx, this.X.bind(this), this.Y.bind(this), this.S.bind(this));
        }
    }

    
}



const gm = new GameManager()

function gameLoop() {
    gm.draw();
    requestAnimationFrame(gameLoop);
}

function onResize() {
    const canvas = document.getElementsByTagName('canvas')[0];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
document.addEventListener('resize', onResize);
document.addEventListener('DOMContentLoaded', () => {
    onResize();
    const sgbOverlay = document.getElementById('overlay');
    document.getElementById('start-game-button').addEventListener('click', () => {
        const canvas = document.getElementsByTagName('canvas')[0];
        const ctx = canvas.getContext('2d');
        gm.init(ctx);
        requestAnimationFrame(gameLoop);
        sgbOverlay.style.display = 'none';
    })
});
document.addEventListener('keydown', (e) => {
    gm.handleKeyDown(e);
});
document.addEventListener('keyup', (e) => {
    gm.handleKeyUp(e);
});
document.addEventListener('mousemove', (e) => {
    gm.updateMouse(e);
})
document.addEventListener('wheel', (e) => {
    gm.handleWheel(e);
})
document.addEventListener('mouseout', () => {
    gm.handleMouseOut();
})