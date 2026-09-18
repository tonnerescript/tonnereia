const fs = require("fs");

const file = "worker/worker.js";
let code = fs.readFileSync(file, "utf8");

if (!code.includes('V4_PHOTOS_TONNERREIA')) {
  code = code.replace(
    /const SYSTEM_PROMPT = \[/,
    `const V4_PHOTOS_TONNERREIA = true;

const SYSTEM_PROMPT = [`
  );

  code = code.replace(
    '  "DESIGN:",',
    `  "DESIGN:",
  "V4 DESIGN PREMIUM:",
  "- Le design doit avoir une identité visuelle forte et originale.",
  "- Évite les templates génériques et les mises en page répétitives.",
  "- Utilise une vraie hiérarchie visuelle avec un hero impressionnant.",
  "- Utilise des espacements généreux et une grille professionnelle.",
  "- Choisis une palette de couleurs adaptée au secteur.",
  "- Choisis des typographies modernes et cohérentes.",
  "- Utilise des boutons premium avec états hover et focus.",
  "- Utilise des cartes élégantes avec profondeur et détails subtils.",
  "- Ajoute des transitions et animations légères.",
  "- Utilise des formes, gradients ou effets visuels seulement lorsqu'ils servent le design.",
  "- Les sections doivent avoir des compositions visuelles variées.",
  "- Le résultat doit ressembler à un vrai site réalisé par une agence web.",
  "- Ne surcharge jamais la page.",
  "- Respecte parfaitement le responsive mobile.",
  "",`
  );

  code = code.replace(
    '  "IMAGES:",',
    `  "IMAGES:",
  "Si des images utilisateur sont disponibles, elles sont représentées par des placeholders.",
  "Utilise les placeholders exactement sous la forme TONNERRE_IMAGE_1, TONNERRE_IMAGE_2, TONNERRE_IMAGE_3, etc.",
  "Place les images aux endroits les plus pertinents du site.",
  "Ne modifie jamais le texte des placeholders.",
  "Une image peut être utilisée plusieurs fois si cela améliore le design.",
  "",`
  );

  code = code.replace(
    /const prompt =\s*String\(body\.prompt \|\| ""\)\.trim\(\);/,
    `const prompt =
    String(body.prompt || "").trim();

  const uploadedImages =
    Array.isArray(body.images) ? body.images : [];`
  );

  code = code.replace(
    /const userPrompt = \[\s*"Active le MODE CRÉATIF AUTOMATIQUE\.",/,
    `const imageInstructions = uploadedImages.length
    ? [
        "",
        "IMAGES FOURNIES PAR L'UTILISATEUR:",
        ...uploadedImages.map((image, index) =>
          "TONNERRE_IMAGE_" + (index + 1) +
          " = image utilisateur disponible"
        ),
        "",
        "Utilise les placeholders TONNERRE_IMAGE_1, TONNERRE_IMAGE_2, etc. dans le HTML."
      ]
    : [];

  const userPrompt = [
    "Active le MODE CRÉATIF AUTOMATIQUE.",`
  );

  code = code.replace(
    /"Utilise plusieurs pages uniquement si elles sont utiles\."\s*\n\s*\]\.join\("\\n"\);/,
    `"Utilise plusieurs pages uniquement si elles sont utiles.",
    ...imageInstructions
  ].join("\\n");`
  );

  code = code.replace(
    /const project =\s*parseProject\(responseText\);/,
    `const project =
      parseProject(responseText);

    // Injection des photos utilisateur
    if (uploadedImages.length) {
      for (const filename of Object.keys(project.files)) {
        let content = project.files[filename];

        for (let i = 0; i < uploadedImages.length; i++) {
          const image = uploadedImages[i];

          if (
            !image ||
            typeof image !== "string"
          ) continue;

          const placeholder =
            "TONNERRE_IMAGE_" + (i + 1);

          content = content.split(
            placeholder
          ).join(image);
        }

        project.files[filename] = content;
      }
    }`
  );

  // Ajout du panneau photos dans l'interface
  code = code.replace(
    '"#message{",',
    `".photosBox{",
  "margin-top:18px;",
  "padding:18px;",
  "border:1px solid #292d44;",
  "border-radius:18px;",
  "background:#101221;",
  "}",
  ".photosTitle{",
  "font-weight:800;",
  "margin-bottom:6px;",
  "}",
  ".photosHint{",
  "font-size:13px;",
  "color:#858da4;",
  "margin-bottom:12px;",
  "}",
  ".photosInput{",
  "width:100%;",
  "padding:12px;",
  "border:1px dashed #454b69;",
  "border-radius:12px;",
  "background:#0b0d18;",
  "color:#fff;",
  "}",
  ".photoList{",
  "display:grid;",
  "grid-template-columns:repeat(4,1fr);",
  "gap:10px;",
  "margin-top:12px;",
  "}",
  ".photoItem{",
  "position:relative;",
  "height:110px;",
  "border-radius:12px;",
  "overflow:hidden;",
  "border:1px solid #34384f;",
  "background:#080a12;",
  "}",
  ".photoItem img{",
  "width:100%;",
  "height:100%;",
  "object-fit:cover;",
  "}",
  ".photoNumber{",
  "position:absolute;",
  "left:7px;",
  "bottom:7px;",
  "padding:4px 7px;",
  "border-radius:7px;",
  "background:rgba(0,0,0,.7);",
  "font-size:11px;",
  "}",
  "@media(max-width:700px){",
  ".photoList{grid-template-columns:repeat(2,1fr);}",
  "}",
  "#message{",`
  );

  // Insère le HTML photos avant le générateur
  code = code.replace(
    '<div class="generator">',
    `<div class="photosBox">
      <div class="photosTitle">🖼️ Tes photos</div>
      <div class="photosHint">
        Ajoute tes propres photos. TonnerreIA les placera automatiquement dans le site.
      </div>
      <input
        id="photosInput"
        class="photosInput"
        type="file"
        accept="image/*"
        multiple
      />
      <div id="photoList" class="photoList"></div>
    </div>

    <div class="generator">`
  );

  // Variables JS
  code = code.replace(
    'const promptInput = document.getElementById("prompt");',
    `const promptInput = document.getElementById("prompt");
const photosInput = document.getElementById("photosInput");
const photoList = document.getElementById("photoList");

let uploadedImages = [];

function resizeImage(file, maxSize = 1400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          const ratio =
            Math.min(maxSize / width, maxSize / height);

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        resolve(
          canvas.toDataURL(
            "image/jpeg",
            0.82
          )
        );
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

photosInput.addEventListener(
  "change",
  async () => {
    uploadedImages = [];
    photoList.innerHTML = "";

    const files =
      Array.from(photosInput.files || []).slice(0, 8);

    for (let i = 0; i < files.length; i++) {
      try {
        const data =
          await resizeImage(files[i]);

        uploadedImages.push(data);

        const item =
          document.createElement("div");

        item.className = "photoItem";

        item.innerHTML =
          '<img src="' +
          data +
          '" alt="Photo ' +
          (i + 1) +
          '">' +
          '<div class="photoNumber">Photo ' +
          (i + 1) +
          "</div>";

        photoList.appendChild(item);
      } catch (error) {
        console.error(
          "Erreur photo:",
          error
        );
      }
    }
  }
);`
  );

  // Ajout des images à la requête generate
  code = code.replace(
    'body: JSON.stringify({ prompt: prompt })',
    'body: JSON.stringify({ prompt: prompt, images: uploadedImages })'
  );

  // Ajout des images à la requête edit
  code = code.replace(
    'body: JSON.stringify({ change: change, project: currentProject })',
    'body: JSON.stringify({ change: change, project: currentProject, images: uploadedImages })'
  );

  fs.writeFileSync(file, code);

  console.log("✅ TonnerreIA V4 installé.");
  console.log("🖼️ Ajout des photos personnelles activé.");
  console.log("🎨 Design Premium activé.");
} else {
  console.log("⚠️ La V4 semble déjà installée.");
}
