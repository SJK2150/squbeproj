    this.controlsText = this.add
      .text(400, 10, "Controls: WASD or Arrow Keys", {
        fontSize: "16px",
        fill: "#fff",
      })
      .setOrigin(0.5, 0);

    // Add distance counter in top right
    this.distanceText = this.add
      .text(770, 50, "DISTANCE\n0.0m", {
        fontSize: "20px",
        fill: "#fff",
        align: "right",
      })
      .setOrigin(1, 0);
