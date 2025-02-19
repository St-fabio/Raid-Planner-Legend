class Raid {
    constructor(raidName, date) {
        this.raidName = raidName;
        this.date = date;
        this.team = [];
        this.isLaunch = false;
        this.nbDPS = 0;
        this.nbTank = 0;
        this.nbHeal = 0;
        this.nbSupport = 0;
    }

    launchRaid() {
        this.isLaunch = true;
    }

    aRejoint(name, role) {
        this.team.push({name, role});
    }

    setNbDps(nbDPS) {
        this.nbDPS = nbDPS;
    }

    setNbTank(nbTank) {
        this.nbTank = nbTank;
    }

    setNbHeal(nbHeal) {
        this.nbHeal = nbHeal;
    }

    setNbSupport(nbSupport) {
        this.nbSupport = nbSupport;
    }
}

module.exports = Raid;