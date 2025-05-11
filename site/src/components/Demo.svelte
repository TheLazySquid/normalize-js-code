<script lang="ts">
    import { normalizeJs } from "normalize-js-code";
    import { onMount } from "svelte";
    
    import { createEditor } from "prism-code-editor";
    import { matchBrackets } from "prism-code-editor/match-brackets"
    import { indentGuides } from "prism-code-editor/guides"
    import "prism-code-editor/prism/languages/javascript";
    import "prism-code-editor/layout.css";
    import "prism-code-editor/scrollbar.css";
    import "prism-code-editor/themes/github-dark.css";
    import { isFunctionDeclaration } from "typescript";

    let editorValue = "let test = 'hello';";
    let outputValue = "let a = 'hello';";

    let useTextarea = false;
    let editorDiv: HTMLElement, outputDiv: HTMLElement;

    const initEditor = (el: HTMLElement, readOnly: boolean, value: string) => {
        return createEditor(
            el,
            { language: "javascript", readOnly, value, tabSize: 4 },
            matchBrackets(),
            indentGuides()
        )
    }

    type EditorType = ReturnType<typeof initEditor>;
    let editor: EditorType, output: EditorType;
    let editorTextarea: HTMLTextAreaElement, outputTextarea: HTMLTextAreaElement;

    function createEditors() {
        editor = initEditor(editorDiv, false, editorValue);
        output = initEditor(outputDiv, true, outputValue);
    }

    const initTextarea = (el: HTMLElement, readOnly: boolean, value: string) => {
        let textarea = document.createElement("textarea");
        textarea.readOnly = readOnly;
        textarea.classList.add("resize-none");
        textarea.spellcheck = false;
        textarea.value = value;
        
        el.appendChild(textarea);
        return textarea;
    }

    function createTextareas() {
        editorTextarea = initTextarea(editorDiv, false, editorValue);
        outputTextarea = initTextarea(outputDiv, true, outputValue);
    }

    onMount(createEditors);

    let error = $state(false);

    function normalize() {
        try {
            if(useTextarea) outputValue = normalizeJs(editorTextarea.value);
            else outputValue = normalizeJs(editor.value);
            error = false;
        } catch {
            outputValue = "// The code was unable to be parsed";
            error = true;
        }

        if(useTextarea) outputTextarea.value = outputValue;
        else output.setOptions({ value: outputValue });
    }

    function toggleTextarea() {
        useTextarea = !useTextarea;

        if(useTextarea) {
            editorValue = editor.value;
            editor.remove();
            output.remove();
            createTextareas();
        } else {
            editorValue = editorTextarea.value;
            editorTextarea.remove();
            outputTextarea.remove();
            createEditors();
        }
    }

    let width: number = $state(1920);
</script>

<svelte:window bind:innerWidth={width} />

<div class="w-screen h-screen bg-gray-950 relative">
    {#if width > 768}
        <div class="absolute top-4 left-8 text-white flex items-center gap-2">
            <input type="checkbox" onclick={toggleTextarea} />
            Use basic textarea? (Much faster)
        </div>
    {/if}
    <div class="grid grid-cols-1 md:grid-cols-2 p-8 pt-4 gap-x-8 gap-y-1 h-full"
    style="grid-template-rows: {width > 768 ? "auto auto 1fr" : "auto auto auto 1fr auto 1fr"}">
        {#if width <= 768}
            <div class="w-full text-white flex items-center justify-center gap-2">
                <input type="checkbox" onclick={toggleTextarea} />
                Use basic textarea? (Much faster)
            </div>
        {/if}
        <div class="md:col-span-2 flex items-center justify-center">
            <button class="text-white bg-green-700 rounded-lg p-2 px-5 cursor-pointer"
            onclick={normalize}>
                Normalize &gt;
            </button>
        </div>
        <div class="text-white text-xl text-center">Input</div>
        {#if width > 768}
            <div class="text-white text-xl text-center">Output</div>
        {/if}
        <div class="overflow-y-auto" bind:this={editorDiv}></div>
        {#if width <= 768}
            <div class="text-white text-xl text-center">Output</div>
        {/if}
        <div class="overflow-y-auto" class:error={error} bind:this={outputDiv}></div>
    </div>
</div>

<style>
    .error :global(.prism-code-editor) {
        border: 1px solid red;
    }

    :global(textarea) {
        color: white;
        width: 100%;
        height: 100%;
        display: block;
        background-color: #0d1117;
    }
</style>