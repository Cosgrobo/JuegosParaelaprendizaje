<template>
  <div
    class="ambient"
    aria-hidden="true"
  >
    <div class="light light-one"></div>
    <div class="light light-two"></div>

    <div class="ambient-grid"></div>

    <div class="jaguar-runner">

      <svg
        class="jaguar"
        viewBox="0 0 260 120"
        xmlns="http://www.w3.org/2000/svg"
      >

        <!-- COLA -->
        <path
          class="jaguar-fur"
          d="
            M45 63
            C22 58 12 44 20 32
            C28 19 43 25 40 35
            C38 42 31 43 27 39
          "
        />

        <!-- CUERPO -->
        <path
          class="jaguar-fur"
          d="
            M50 48
            C73 30 117 30 153 40
            C170 44 183 53 187 67
            C183 80 164 86 145 86
            L83 86
            C59 86 42 75 42 62
            C42 56 45 51 50 48Z
          "
        />

        <!-- PECHO -->
        <path
          class="jaguar-fur"
          d="
            M155 43
            C168 39 184 41 194 51
            L185 75
            C173 78 159 72 154 61Z
          "
        />

        <!-- CABEZA -->
        <path
          class="jaguar-fur"
          d="
            M181 36
            C190 25 211 26 221 39
            C229 50 224 68 211 75
            C196 83 177 73 176 57
            C175 49 177 42 181 36Z
          "
        />

        <!-- OREJAS -->
        <path
          class="jaguar-fur"
          d="M184 37 L181 22 L195 32Z"
        />

        <path
          class="jaguar-fur"
          d="M212 34 L221 22 L221 41Z"
        />

        <!-- PATAS -->
        <path
          class="jaguar-fur"
          d="
            M66 79
            L63 104
            C62 110 67 113 75 111
            L81 108
            L77 104
            L79 82Z
          "
        />

        <path
          class="jaguar-fur"
          d="
            M103 82
            L105 106
            C105 112 112 113 119 110
            L124 107
            L119 103
            L118 82Z
          "
        />

        <path
          class="jaguar-fur"
          d="
            M157 78
            L163 101
            C164 108 171 110 178 107
            L183 103
            L177 100
            L174 75Z
          "
        />

        <path
          class="jaguar-fur"
          d="
            M181 70
            L190 94
            C192 100 199 101 205 97
            L209 93
            L203 91
            L198 65Z
          "
        />

        <!-- HOCICO -->
        <ellipse
          class="jaguar-muzzle"
          cx="218"
          cy="58"
          rx="13"
          ry="9"
        />

        <!-- NARIZ -->
        <path
          class="jaguar-dark"
          d="
            M226 53
            L236 56
            L227 61Z
          "
        />

        <!-- OJO -->
        <ellipse
          class="jaguar-eye"
          cx="211"
          cy="45"
          rx="2.8"
          ry="2.3"
        />

        <!-- MANCHAS -->
        <g class="spots">
          <circle cx="70" cy="51" r="3" />
          <circle cx="89" cy="45" r="3.5" />
          <circle cx="110" cy="54" r="3" />
          <circle cx="130" cy="46" r="4" />
          <circle cx="150" cy="57" r="3.2" />

          <circle cx="62" cy="68" r="2.7" />
          <circle cx="82" cy="70" r="4" />
          <circle cx="104" cy="67" r="3" />
          <circle cx="128" cy="72" r="3.5" />
          <circle cx="151" cy="70" r="2.8" />

          <circle cx="188" cy="48" r="2.4" />
          <circle cx="199" cy="38" r="2.6" />
          <circle cx="202" cy="61" r="2.8" />
        </g>

      </svg>

    </div>

  </div>
</template>

<style scoped>
.ambient {
  position: fixed;
  inset: 0;

  z-index: 0;

  overflow: hidden;

  pointer-events: none;

  background:
    linear-gradient(
      145deg,
      #eef2ff 0%,
      #f8fbff 48%,
      #edfaff 100%
    );
}

.light {
  position: absolute;

  border-radius: 50%;

  filter: blur(80px);

  opacity: 0.55;
}

.light-one {
  width: 430px;
  height: 430px;

  top: -170px;
  left: -150px;

  background:
    rgba(99, 102, 241, 0.25);
}

.light-two {
  width: 470px;
  height: 470px;

  top: 14%;
  right: -210px;

  background:
    rgba(56, 189, 248, 0.20);
}

.ambient-grid {
  position: absolute;

  inset: 0;

  opacity: 0.13;

  background-image:
    linear-gradient(
      rgba(99, 102, 241, 0.05) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(99, 102, 241, 0.05) 1px,
      transparent 1px
    );

  background-size:
    55px 55px;

  mask-image:
    linear-gradient(
      to bottom,
      black,
      transparent 88%
    );
}

.jaguar-runner {
  position: absolute;

  left: -250px;
  bottom: 32px;

  width: 190px;

  opacity: 0;

  will-change:
    transform,
    opacity;

  animation:
    jaguarWalk 30s linear infinite;
}

.jaguar {
  display: block;

  width: 100%;

  filter:
    drop-shadow(
      0 9px 8px
      rgba(49, 46, 129, 0.12)
    );
}

.jaguar-fur {
  fill: #d99b32;

  stroke: #734a18;

  stroke-width: 2;

  stroke-linejoin: round;

  stroke-linecap: round;
}

.jaguar-muzzle {
  fill: #f5d59a;
}

.jaguar-dark {
  fill: #37220f;
}

.jaguar-eye {
  fill: #172554;
}

.spots {
  fill: #513011;
}

@keyframes jaguarWalk {
  0% {
    transform:
      translate3d(
        -50px,
        0,
        0
      );

    opacity: 0;
  }

  15% {
    opacity: 0;
  }

  18% {
    opacity: 0.78;
  }

  28% {
    transform:
      translate3d(
        25vw,
        -2px,
        0
      );

    opacity: 0.78;
  }

  38% {
    transform:
      translate3d(
        55vw,
        1px,
        0
      );
  }

  50% {
    transform:
      translate3d(
        calc(100vw + 350px),
        -2px,
        0
      );

    opacity: 0.70;
  }

  53% {
    opacity: 0;
  }

  100% {
    transform:
      translate3d(
        calc(100vw + 350px),
        0,
        0
      );

    opacity: 0;
  }
}

@media (max-width: 700px) {
  .jaguar-runner {
    width: 135px;

    bottom: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .jaguar-runner {
    display: none;
  }
}
</style>