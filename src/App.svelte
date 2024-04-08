<script>
  import { Router, Route, Link } from 'svelte-routing';

  import LoadingExamples from './lib/examples/LoadingExamples.svelte';
  import ObjectCreationExamples from './lib/examples/ObjectCreationExamples.svelte';
</script>

<main>
  <h1>Interaktīva mijiedarbība ar 3D objektiem, modeļiem un ainām, izmantojot Three.js</h1>

  <Router>
    <nav>
      <Link to="/examples-1">#1 - 3D objektu ģenerēšana</Link>
      <Link to="/examples-2">#2 - 3D objektu, modeļu un ainu importēšana</Link>
    </nav>
    <Route path="/examples-1" component={ObjectCreationExamples} />
    <Route path="/examples-2" component={LoadingExamples} />
  </Router>
</main>