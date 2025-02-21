<script lang="ts">
  export let width: string = "600px";
  export let height: string = "600px";
</script>

<svg width={width} height={height} viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- This filter simulates a 3D extrusion by offsetting and blurring the source -->
    <filter id="extrude">
      <feOffset in="SourceAlpha" dx="5" dy="5" result="offset"/>
      <feGaussianBlur in="offset" stdDeviation="2" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0   
                                                   0 0 0 0 0   
                                                   0 0 0 0 0   
                                                   0 0 0 0.5 0" result="shadow"/>
      <feBlend in="SourceGraphic" in2="shadow" mode="normal"/>
    </filter>
  </defs>
  <g filter="url(#extrude)">
    <!-- A custom cloud shape path; adjust the d attribute as desired -->
    <path d="M50,60 C35,60 30,45 40,35 C45,25 60,20 70,25 C80,15 100,10 110,20 
             C125,15 140,20 150,30 C165,30 160,50 150,55 C155,70 140,80 130,75 
             C115,85 95,80 90,65 C75,70 60,70 50,60 Z" fill="white"/>
  </g>
</svg> 