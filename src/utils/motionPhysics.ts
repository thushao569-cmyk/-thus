import { JointKinematics, MatrixState } from '../types';

export interface PhysicsVelocities {
  leftArmAngle: number;
  bodyElevate: number;
  bodyTilt: number;
  rightArmAngle: number;
  leftLegAngle: number;
  rightLegAngle: number;
}

export class PuppetPhysicsEngine {
  private state: JointKinematics = {
    leftArmAngle: 0,
    bodyElevate: 0,
    bodyTilt: 0,
    rightArmAngle: 0,
    leftLegAngle: 0,
    rightLegAngle: 0,
    spinAngle: 0,
    isFiveChord: false,
    isTripleChord: false,
  };

  private velocities: PhysicsVelocities = {
    leftArmAngle: 0,
    bodyElevate: 0,
    bodyTilt: 0,
    rightArmAngle: 0,
    leftLegAngle: 0,
    rightLegAngle: 0,
  };

  // Pirouette spin dynamics (360-degree turntable turning)
  private currentSpinAngle = 0;
  private targetSpinAngle = 0;
  private spinVelocity = 0;

  // Pushrod elevation persistence (simulating mechanical cam hold & decay)
  private pushrodEnergies: [number, number, number] = [0, 0, 0];

  // Parameters
  // Frequency omega (responsiveness): higher = snappier, lower = more fluid
  private omegaArm = 18.0; 
  private omegaBody = 14.0;
  private omegaLeg = 16.0;
  // Damping ratio zeta: ~0.9 = slight mechanical overshoot then smooth settling
  private zeta = 0.92;

  public reset() {
    this.state = {
      leftArmAngle: 0,
      bodyElevate: 0,
      bodyTilt: 0,
      rightArmAngle: 0,
      leftLegAngle: 0,
      rightLegAngle: 0,
      spinAngle: 0,
      isFiveChord: false,
      isTripleChord: false,
    };
    this.velocities = {
      leftArmAngle: 0,
      bodyElevate: 0,
      bodyTilt: 0,
      rightArmAngle: 0,
      leftLegAngle: 0,
      rightLegAngle: 0,
    };
    this.currentSpinAngle = 0;
    this.targetSpinAngle = 0;
    this.spinVelocity = 0;
    this.pushrodEnergies = [0, 0, 0];
  }

  public getState(): JointKinematics {
    return { ...this.state };
  }

  /**
   * Trigger a 360-degree pirouette rotation (转圈)
   */
  public triggerSpin(turns: number = 1) {
    this.targetSpinAngle += 360 * turns;
  }

  /**
   * Derive continuous targets from the matrix around the needle position.
   * When all 5 notes are lit on the same beat, triggers single-hand raised pirouette pose.
   */
  public computeTargetFromMatrix(
    matrix: MatrixState,
    needleColPos: number
  ): JointKinematics {
    const colCount = 16;
    const currentCol = Math.floor(needleColPos) % colCount;
    const nextCol = (currentCol + 1) % colCount;
    const frac = needleColPos - Math.floor(needleColPos); // 0 to 1

    // Evaluate proximity weight of studs for continuous mechanical cam follower
    let leftWeight = 0;
    let bodyWeight = 0;
    let rightWeight = 0;
    let leftLegWeight = 0;
    let rightLegWeight = 0;
    let fiveChordWeight = 0;

    // Check adjacent columns [-1, 0, +1] around needle
    for (let offset = -1; offset <= 1; offset++) {
      const col = (currentCol + offset + colCount) % colCount;
      const studCenter = Math.floor(needleColPos) + offset + 0.5;
      const dist = Math.abs(needleColPos - studCenter);

      // Cam lobe radius is approx 0.8 column widths
      if (dist < 0.9) {
        const camLobe = Math.cos((dist / 0.9) * (Math.PI / 2));
        const lobeWeight = Math.max(0, camLobe * camLobe);

        const hasLeft = matrix[0]?.[col] === 1;
        const hasBody = matrix[1]?.[col] === 1;
        const hasRight = matrix[2]?.[col] === 1;
        const hasLeftLeg = matrix[3]?.[col] === 1;
        const hasRightLeg = matrix[4]?.[col] === 1;

        if (hasLeft) leftWeight = Math.max(leftWeight, lobeWeight);
        if (hasBody) bodyWeight = Math.max(bodyWeight, lobeWeight);
        if (hasRight) rightWeight = Math.max(rightWeight, lobeWeight);
        if (hasLeftLeg) leftLegWeight = Math.max(leftLegWeight, lobeWeight);
        if (hasRightLeg) rightLegWeight = Math.max(rightLegWeight, lobeWeight);

        // ONLY when all 5 notes on this beat are lit!
        if (hasLeft && hasBody && hasRight && hasLeftLeg && hasRightLeg) {
          fiveChordWeight = Math.max(fiveChordWeight, lobeWeight);
        }
      }
    }

    // Target angles and displacements:
    // When on the same beat all 5 notes are lit ("五个音阶同时确认按动"):
    // "举起单手": Right arm raises high overhead in triumphant pirouette salute (-120°),
    // while left arm stays tucked neatly at waist (-5°).
    // Legs align firmly on turntable for rotation.
    // When normal:
    // Left arm: 0 -> -48° (sweeping upward/outward)
    // Right arm: 0 -> +48° (sweeping downward/striking chime)
    // Left leg: 0 -> -28° (kicking forward / step)
    // Right leg: 0 -> -28° (kicking forward / step)
    const normalLeftArm = -48 * leftWeight;
    const normalRightArm = 48 * rightWeight;
    const normalLeftLeg = -28 * leftLegWeight;
    const normalRightLeg = -28 * rightLegWeight;

    const fiveLeftArm = -5;
    const fiveRightArm = -120; // Mallet raised high overhead towards the sky
    const fiveLeftLeg = 0;
    const fiveRightLeg = 0;

    const targetLeftArm = fiveChordWeight * fiveLeftArm + (1 - fiveChordWeight) * normalLeftArm;
    const targetRightArm = fiveChordWeight * fiveRightArm + (1 - fiveChordWeight) * normalRightArm;
    const targetLeftLeg = fiveChordWeight * fiveLeftLeg + (1 - fiveChordWeight) * normalLeftLeg;
    const targetRightLeg = fiveChordWeight * fiveRightLeg + (1 - fiveChordWeight) * normalRightLeg;

    // Body: 0 -> -20px (elevating upward on tiptoes)
    const targetBodyElevate = -Math.max(20 * bodyWeight, 18 * fiveChordWeight);

    // Counterbalance tilt: holds poised upright (0°) while spinning
    const targetBodyTilt = (rightWeight - leftWeight) * 3.5 * (1 - fiveChordWeight);

    return {
      leftArmAngle: targetLeftArm,
      bodyElevate: targetBodyElevate,
      bodyTilt: targetBodyTilt,
      rightArmAngle: targetRightArm,
      leftLegAngle: targetLeftLeg,
      rightLegAngle: targetRightLeg,
      spinAngle: this.currentSpinAngle,
      isFiveChord: fiveChordWeight > 0.1,
      isTripleChord: fiveChordWeight > 0.1,
    };
  }

  /**
   * Step the physical simulation forward by dt seconds using damped spring physics.
   */
  public step(
    target: JointKinematics,
    dt: number,
    speedMultiplier: number = 1.0
  ): JointKinematics {
    // Clamp dt to prevent instability on frame drop or tab switch
    const clampedDt = Math.min(dt, 0.05) * speedMultiplier;
    if (clampedDt <= 0) return this.state;

    // Update left arm
    this.updateJointSpring(
      'leftArmAngle',
      target.leftArmAngle,
      this.omegaArm,
      this.zeta,
      clampedDt
    );

    // Update body elevation
    this.updateJointSpring(
      'bodyElevate',
      target.bodyElevate,
      this.omegaBody,
      this.zeta,
      clampedDt
    );

    // Update body tilt
    this.updateJointSpring(
      'bodyTilt',
      target.bodyTilt,
      this.omegaBody * 0.9,
      this.zeta * 1.1,
      clampedDt
    );

    // Update right arm
    this.updateJointSpring(
      'rightArmAngle',
      target.rightArmAngle,
      this.omegaArm,
      this.zeta,
      clampedDt
    );

    // Update left leg
    this.updateJointSpring(
      'leftLegAngle',
      target.leftLegAngle,
      this.omegaLeg,
      this.zeta,
      clampedDt
    );

    // Update right leg
    this.updateJointSpring(
      'rightLegAngle',
      target.rightLegAngle,
      this.omegaLeg,
      this.zeta,
      clampedDt
    );

    // Rotational spring dynamics for 360-degree pirouette spin (转圈)
    const spinDisplacement = this.currentSpinAngle - this.targetSpinAngle;
    if (Math.abs(spinDisplacement) > 0.05 || Math.abs(this.spinVelocity) > 0.1) {
      const omegaSpin = 10.5 * Math.max(0.7, speedMultiplier);
      const zetaSpin = 0.88;
      const spinAccel =
        -2 * zetaSpin * omegaSpin * this.spinVelocity -
        omegaSpin * omegaSpin * spinDisplacement;
      this.spinVelocity += spinAccel * clampedDt;
      this.currentSpinAngle += this.spinVelocity * clampedDt;

      // Wrap around cleanly when resting
      if (
        Math.abs(this.currentSpinAngle - this.targetSpinAngle) < 0.2 &&
        Math.abs(this.spinVelocity) < 0.2
      ) {
        this.currentSpinAngle = this.targetSpinAngle % 360;
        this.targetSpinAngle = this.currentSpinAngle;
        this.spinVelocity = 0;
      }
    }

    this.state.spinAngle = this.currentSpinAngle;
    this.state.isFiveChord = target.isFiveChord;
    this.state.isTripleChord = target.isFiveChord;

    return { ...this.state };
  }

  private updateJointSpring(
    key: keyof PhysicsVelocities,
    targetVal: number,
    omega: number,
    zeta: number,
    dt: number
  ) {
    const currentVal = this.state[key];
    const currentVel = this.velocities[key];

    // Damped harmonic oscillator differential equation:
    // a = -2 * zeta * omega * v - omega^2 * (x - target)
    const displacement = currentVal - targetVal;
    const accel = -2 * zeta * omega * currentVel - omega * omega * displacement;

    // Euler-Cromer integration for energy conservation
    const nextVel = currentVel + accel * dt;
    const nextVal = currentVal + nextVel * dt;

    this.velocities[key] = nextVel;
    this.state[key] = nextVal;
  }
}

export const puppetPhysics = new PuppetPhysicsEngine();
