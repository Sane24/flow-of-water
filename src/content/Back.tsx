import { asset } from '../data/figures'
import { LIVE_URL, REPO_URL } from '../components/Layout'
import { Frog, WaveRule } from '../components/Motifs'

export function Observations() {
  return (
    <section id="observations" className="closing flow" data-toc data-ambient="forest" aria-labelledby="obs-title">
      <p className="eyebrow">Experiments and observations</p>
      <h2 id="obs-title" className="closing__title">What I kept noticing</h2>
      <div className="obs-grid">
        <article className="obs">
          <h3>Averages are blurry, samples commit</h3>
          <p>
            The same thing happened in both parts. Part A's one-step estimate was soft and actually beat Euler on
            MSE (0.0071 vs 0.0086), and Part B's pure-noise denoiser collapsed to the mean digit. A squared-error
            regressor predicts an average. Iterating with fresh velocity estimates lets the sampler commit to one
            sharp answer, which looks better and can score worse.
          </p>
        </article>
        <article className="obs">
          <h3>The generic prompt has a favorite subject</h3>
          <p>
            “A high quality photo” meant a portrait of a person in all five of my samples from noise, and again in
            the <M2>t = 0.02</M2> column of almost every edit. When the input carries almost no information, the model's
            prior shows through.
          </p>
        </article>
        <article className="obs">
          <h3>Edits survive when the structure fits</h3>
          <p>
            The galaxy prompt held on to a higher starting time than the mansion prompt, and the volcano and wine
            anagram worked because both prompts wanted a dark mass with a bright line through it. When two prompts
            can share a silhouette, the sampler does not have to pick one.
          </p>
        </article>
        <article className="obs">
          <h3>Guidance trades variety for reliability</h3>
          <p>
            <M2>w = 7</M2> in Part A fixed every melted face and turned five different photos into five similar
            headshots. In Part B, guidance with <M2>γ = 5</M2> on a class-conditioned model gave legible digits after a
            single epoch.
          </p>
        </article>
        <article className="obs">
          <h3>Change one thing at a time</h3>
          <p>
            My revised clockwork hybrid changed both prompts and the seed at once, so I cannot say for sure which
            change removed the face. The scheduler experiment was cleaner: same seed, same data order, one
            difference, and the answer was clear (nearly a tie).
          </p>
        </article>
      </div>
      <WaveRule />
    </section>
  )
}

function M2({ children }: { children: string }) {
  return <span className="math-plain">{children}</span>
}

export function References() {
  return (
    <section id="references" className="closing references flow" data-toc data-ambient="forest" aria-labelledby="ref-title">
      <p className="eyebrow">References and code</p>
      <h2 id="ref-title" className="closing__title">Sources</h2>
      <div className="ref-grid">
        <div>
          <h3>Code</h3>
          <ul className="ref-list">
            <li>
              Repository: <a href={REPO_URL}>{REPO_URL.replace('https://', '')}</a>
            </li>
            <li>
              Live site: <a href={LIVE_URL}>{LIVE_URL.replace('https://', '')}</a>
            </li>
            <li>
              Part A notebook: <a href={`${REPO_URL}/blob/main/notebooks/cs180_project3_partA.ipynb`}>notebooks/cs180_project3_partA.ipynb</a>
            </li>
            <li>
              Part B notebook: <a href={`${REPO_URL}/blob/main/notebooks/cs180_project3_partB.ipynb`}>notebooks/cs180_project3_partB.ipynb</a>
            </li>
            <li>
              Figure manifest with the source file of every image: <code>src/data/manifest.json</code>
            </li>
          </ul>
          <h3>Assignment</h3>
          <ul className="ref-list">
            <li>
              <a href="https://cal-cs180.github.io/fa26/hw/proj3-flow/parta.html">Part A: Exploring the Power of Flow Models</a>
            </li>
            <li>
              <a href="https://cal-cs180.github.io/fa26/hw/proj3-flow/partb.html">Part B: Flow Matching from Scratch</a>
            </li>
          </ul>
        </div>
        <div>
          <h3>Papers and models</h3>
          <ul className="ref-list">
            <li>
              PixNerd-XXL-P16-T2I, <a href="https://huggingface.co/MCG-NJU/PixNerd-XXL-P16-T2I">MCG-NJU on Hugging Face</a>.
            </li>
            <li>Lipman et al., Flow Matching for Generative Modeling, ICLR 2023.</li>
            <li>Liu, Gong and Liu, Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow, ICLR 2023.</li>
            <li>Ho and Salimans, Classifier-Free Diffusion Guidance, 2022.</li>
            <li>Meng et al., SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations, ICLR 2022.</li>
            <li>Geng, Park and Owens, Visual Anagrams: Generating Multi-View Optical Illusions with Diffusion Models, CVPR 2024.</li>
            <li>Geng, Park and Owens, Factorized Diffusion: Perceptual Illusions by Noise Decomposition, ECCV 2024.</li>
            <li>Ronneberger, Fischer and Brox, U-Net: Convolutional Networks for Biomedical Image Segmentation, MICCAI 2015.</li>
          </ul>
        </div>
        <div>
          <h3>Prints and engravings</h3>
          <ul className="ref-list ref-list--credits">
            <li>
              <img src={asset('images/decorative/haeckel-frog-detail.webp')} alt="" width={420} height={437} loading="lazy" />
              <span>
                Ernst Haeckel, <em>Kunstformen der Natur</em> (1904), plate 68, Batrachia. Public domain, via{' '}
                <a href="https://commons.wikimedia.org/wiki/File:Haeckel_Batrachia.jpg">Wikimedia Commons</a>. Toned
                to the site palette.
              </span>
            </li>
            <li>
              <img src={asset('images/decorative/haeckel-tineida-plate.webp')} alt="" width={900} height={1271} loading="lazy" />
              <span>
                Ernst Haeckel, <em>Kunstformen der Natur</em> (1904), plate 58, Tineida. Public domain, via{' '}
                <a href="https://commons.wikimedia.org/wiki/File:Haeckel_Tineida.jpg">Wikimedia Commons</a>.
              </span>
            </li>
            <li>
              <img src={asset('images/decorative/haeckel-muscinae-moss.webp')} alt="" width={560} height={669} loading="lazy" />
              <span>
                Ernst Haeckel, <em>Kunstformen der Natur</em> (1904), plate 72, Muscinae. Public domain, via{' '}
                <a href="https://commons.wikimedia.org/wiki/File:Haeckel_Muscinae.jpg">Wikimedia Commons</a>.
              </span>
            </li>
            <li>
              <img src={asset('images/decorative/hokusai-great-wave-ink.webp')} alt="" width={1000} height={672} loading="lazy" />
              <span>
                Katsushika Hokusai, <em>The Great Wave off Kanagawa</em> (c. 1831). Public domain, via{' '}
                <a href="https://commons.wikimedia.org/wiki/File:Tsunami_by_hokusai_19th_century.jpg">Wikimedia Commons</a>.
              </span>
            </li>
            <li>
              <img src={asset('images/decorative/hokusai-kirifuri-falls.webp')} alt="" width={560} height={793} loading="lazy" />
              <span>
                Katsushika Hokusai, <em>Kirifuri Waterfall at Kurokami Mountain</em> (c. 1832). CC0, The Metropolitan
                Museum of Art, via{' '}
                <a href="https://commons.wikimedia.org/wiki/File:Kirifuri_Waterfall_at_Kurokami_Mountain_in_Shimotsuke_MET_DP141256.jpg">
                  Wikimedia Commons
                </a>
                .
              </span>
            </li>
            <li>
              <img src={asset('images/decorative/steinlen-chat-noir-cat.webp')} alt="" width={440} height={440} loading="lazy" />
              <span>
                Théophile-Alexandre Steinlen, <em>Tournée du Chat Noir</em> (1896), detail of the cat with the lettering
                removed. Public domain, via{' '}
                <a href="https://commons.wikimedia.org/wiki/File:Th%C3%A9ophile-Alexandre_Steinlen_-_Tourn%C3%A9e_du_Chat_Noir_de_Rodolphe_Salis_(Tour_of_Rodolphe_Salis%27_Chat_Noir)_-_Google_Art_Project.jpg">
                  Wikimedia Commons
                </a>
                .
              </span>
            </li>
          </ul>
          <p className="small">
            The frog, cat, butterfly, fern, stained glass and wave drawings, the UNet diagrams, and the animated water
            are original work for this page. None of the decorative images are model outputs. Type is set in Fraunces,
            Instrument Sans, IBM Plex Mono and Caveat (SIL Open Font License).
          </p>
        </div>
      </div>
      <footer className="colophon">
        <Frog />
        <p>Flow of Water · CS180 Project 3 · UC Berkeley · Fall 2026</p>
        <a href="#top">back to the top</a>
      </footer>
    </section>
  )
}
