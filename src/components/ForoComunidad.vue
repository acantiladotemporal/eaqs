<script setup>
import { onMounted, ref } from 'vue';
import { resolveSessionUser } from '../lib/auth-client';
import { supabase } from '../lib/supabase';

const posts = ref([]);
const nuevoTitulo = ref('');
const nuevoMensaje = ref('');
const cargando = ref(false);
const publicando = ref(false);
const feedback = ref('');
const feedbackError = ref(false);
const user = ref(null);

function setFeedback(message, isError = false) {
  feedback.value = message;
  feedbackError.value = isError;
}

async function cargarPosts() {
  cargando.value = true;
  const { data, error } = await supabase
    .from('posts')
    .select('id,title,content,author_name,created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    setFeedback('No se pudo cargar la comunidad. Intenta recargar.', true);
    cargando.value = false;
    return;
  }

  posts.value = data ?? [];
  cargando.value = false;
}

async function enviarPost() {
  const title = nuevoTitulo.value.trim();
  const content = nuevoMensaje.value.trim();

  if (!title || !content) {
    setFeedback('Completa titulo y mensaje antes de publicar.', true);
    return;
  }

  if (!user.value) {
    setFeedback('Necesitas iniciar sesion para publicar.', true);
    window.location.href = '/login?next=/foro';
    return;
  }

  publicando.value = true;
  setFeedback('');

  const authorName =
    user.value.user_metadata?.full_name ||
    user.value.email?.split('@')[0] ||
    'Docente';

  const { error } = await supabase.from('posts').insert({
    title,
    content,
    author_name: authorName,
  });

  if (error) {
    setFeedback('No se pudo publicar tu mensaje. Vuelve a intentarlo.', true);
    publicando.value = false;
    return;
  }

  nuevoTitulo.value = '';
  nuevoMensaje.value = '';
  setFeedback('Publicacion creada correctamente.');
  publicando.value = false;
  await cargarPosts();
}

onMounted(async () => {
  user.value = await resolveSessionUser();
  if (!user.value) {
    window.location.href = '/login?next=/foro';
    return;
  }
  await cargarPosts();
});
</script>

<template>
  <div class="max-w-5xl mx-auto py-12">
    <div class="mb-20 space-y-10 ui-panel p-8 md:p-12">
      <div>
        <span class="font-sans text-[10px] uppercase tracking-[0.4em] text-moss font-bold mb-4 block text-center">
          Intercambio de saberes
        </span>
        <h2 class="font-display text-5xl italic text-ink text-center">Nueva reflexion.</h2>
      </div>

      <div class="space-y-6 max-w-2xl mx-auto">
        <div>
          <label for="foro-title" class="field-label">Titulo de la discusion</label>
          <input
            id="foro-title"
            v-model="nuevoTitulo"
            type="text"
            maxlength="120"
            placeholder="Que te esta funcionando en el aula?"
            class="input-base"
          />
        </div>
        <div>
          <label for="foro-message" class="field-label">Mensaje</label>
          <textarea
            id="foro-message"
            v-model="nuevoMensaje"
            maxlength="1200"
            placeholder="Comparte una experiencia concreta, una duda o un recurso."
            class="textarea-base"
          ></textarea>
        </div>
      </div>

      <p
        :class="feedbackError ? 'text-sm text-red-700 text-center min-h-6' : 'text-sm text-moss text-center min-h-6'"
        aria-live="polite"
      >
        {{ feedback }}
      </p>

      <div class="text-center">
        <button
          type="button"
          @click="enviarPost"
          class="btn btn-lg btn-primary"
          :disabled="publicando"
        >
          {{ publicando ? 'Publicando...' : 'Anadir al archivo' }}
        </button>
      </div>
    </div>

    <div class="space-y-0 border-t border-clay/30">
      <p v-if="cargando" class="py-12 text-ink/50">Cargando publicaciones...</p>
      <p v-else-if="!posts.length" class="py-12 text-ink/50">
        Aun no hay publicaciones. Puedes abrir la primera conversacion.
      </p>
      <article
        v-for="post in posts"
        :key="post.id"
        class="group py-12 border-b border-clay/30 flex flex-col md:flex-row gap-10 items-start hover:bg-white px-6 transition-colors duration-500"
      >
        <div class="w-full md:w-1/4">
          <p class="font-sans text-[10px] uppercase tracking-widest text-moss font-bold">
            {{ new Date(post.created_at).toLocaleDateString('es-ES', { dateStyle: 'long' }) }}
          </p>
          <p class="font-display text-xl italic text-ink mt-2">{{ post.author_name }}</p>
        </div>

        <div class="w-full md:w-3/4 space-y-3">
          <h3 class="font-display text-3xl md:text-4xl text-ink leading-tight italic group-hover:translate-x-2 transition-transform duration-700">
            {{ post.title }}
          </h3>
          <p class="font-sans text-ink/65 leading-relaxed max-w-2xl whitespace-pre-wrap">
            {{ post.content }}
          </p>
        </div>
      </article>
    </div>
  </div>
</template>
