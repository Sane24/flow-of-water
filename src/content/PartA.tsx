import { fig } from '../data/figures'
import { Figure, FigureRow, Meta } from '../components/Figure'
import { Eq, M } from '../components/Math'
import { MarginPlate, Params, Section, SubHead } from '../components/Layout'
import { EditTimeline } from '../components/EditTimeline'
import { AnagramViewer } from '../components/AnagramViewer'
import { HybridViewer } from '../components/HybridViewer'
import { Butterfly, Cat, Frog, Lancet } from '../components/Motifs'
import { FrameScrubber, InterpolationPlayground } from '../components/Interactive'
import { Caustics, Fireflies } from '../components/Ambient'
import { NightShore, Pond, WaveEdge } from '../components/Scenes'
import { Sketchbook } from '../components/Sketchbook'
import { asset } from '../data/figures'

const seeds = [180, 181, 182, 183, 184]

export function PartA() {
  return (
    <>
      {/* ------------------------------------------------------------ 1.1 */}
      <Section id="a-1-1" num="1.1" title="Constructing Noisy Training Inputs">
        <p>
          Flow matching moves along a straight line between Gaussian noise and a clean image. Every noisy training
          input is a point on that line:
        </p>
        <Eq tag="A.1">{String.raw`x_t = (1 - t)\,\epsilon + t\,x_1, \qquad \epsilon \sim \mathcal{N}(0, I)`}</Eq>
        <p>
          At <M>{String.raw`t = 0`}</M> this is pure noise and at <M>{String.raw`t = 1`}</M> it is the clean image. My implementation is one
          line, <code>(1 - t) * noise + t * image</code>.
        </p>
        <p>
          For 1.1 to 1.5 I used my own night photo of a house instead of the Campanile, center-cropped to 512 × 512.
          One noise tensor (seed 180) is reused at all three times, so only <M>{String.raw`t`}</M> changes across the row.
        </p>
        <Params
          items={[
            ['image', 'nighthouse.png, 512 × 512'],
            ['noise', 'one ε, seed 180'],
            ['t', '0.25, 0.50, 0.75'],
          ]}
        />
        <FigureRow
          label="Fig. A1"
          items={[
            { entry: fig('a11-nighthouse-original'), label: 'original' },
            { entry: fig('a11-nighthouse-t0.25'), label: 't = 0.25' },
            { entry: fig('a11-nighthouse-t0.50'), label: 't = 0.50' },
            { entry: fig('a11-nighthouse-t0.75'), label: 't = 0.75' },
          ]}
          caption="The forward process on my photo. Same ε in every panel."
          meta={<Meta entry={fig('a11-nighthouse-t0.25')} />}
        />
        <p>
          At <M>{String.raw`t = 0.25`}</M> the photo is almost all static, with only the moon and the lit window showing through. By{' '}
          <M>{String.raw`t = 0.5`}</M> the roofline, trees and fence are readable, and at <M>{String.raw`t = 0.75`}</M> everything is there,
          just grainy.
        </p>
        <InterpolationPlayground entry={fig('a11-nighthouse-original')} />
      </Section>

      {/* ------------------------------------------------------------ 1.2 */}
      <Section id="a-1-2" num="1.2" title="Classical Denoising">
        <p>
          Before using the model, I tried the obvious baseline: blur the noise away. The image inside{' '}
          <M>{String.raw`x_t`}</M> is scaled down by <M>{String.raw`t`}</M>, so I divide by <M>{String.raw`t`}</M> first and then apply a Gaussian
          filter <M>{String.raw`G_\sigma`}</M>:
        </p>
        <Eq>{String.raw`\frac{x_t}{t} = x_1 + \frac{1 - t}{t}\,\epsilon, \qquad \hat{x}_1^{\text{blur}} = G_\sigma\!\left(\frac{x_t}{t}\right)`}</Eq>
        <p>
          I swept <M>{String.raw`\sigma \in \{1, 2, 4, 8, 16\}`}</M> and kept the lowest MSE against the clean image:{' '}
          <M>{String.raw`\sigma = 16`}</M> at <M>{String.raw`t = 0.25`}</M>, <M>{String.raw`\sigma = 4`}</M> at <M>{String.raw`t = 0.5`}</M>, and <M>{String.raw`\sigma = 1`}</M> at{' '}
          <M>{String.raw`t = 0.75`}</M>. Noisier inputs need wider blurs, which also wipe out more edges.
        </p>
        <FigureRow
          label="Fig. A2"
          columns={6}
          items={[
            { entry: fig('a12-t0.25-noisy'), label: 'noisy, t = 0.25' },
            { entry: fig('a12-t0.25-blur'), label: 'blur, σ = 16' },
            { entry: fig('a12-t0.50-noisy'), label: 'noisy, t = 0.50' },
            { entry: fig('a12-t0.50-blur'), label: 'blur, σ = 4' },
            { entry: fig('a12-t0.75-noisy'), label: 'noisy, t = 0.75' },
            { entry: fig('a12-t0.75-blur'), label: 'blur, σ = 1' },
          ]}
          caption="Each noisy input next to its best Gaussian blur (lowest MSE in the σ sweep)."
          meta="baseline output · blur_0.25.png, blur_0.5.png, blur_0.75.png"
        />
        <p>
          At <M>{String.raw`t = 0.25`}</M> the best blur is colored blobs. At <M>{String.raw`t = 0.5`}</M> the shapes come back but the windows
          and fence turn to mush, and at <M>{String.raw`t = 0.75`}</M> it looks fine at a glance but still has grain.
        </p>
      </Section>

      {/* ------------------------------------------------------------ 1.3 */}
      <Section id="a-1-3" num="1.3" title="One-Step Denoising">
        <p>
          PixNerd predicts velocity, the direction <M>{String.raw`x_1 - \epsilon`}</M> along the straight path, not the noise.
          Because <M>{String.raw`x_1 = x_t + (1 - t)(x_1 - \epsilon)`}</M> holds exactly, a perfect velocity prediction would
          recover the image in one jump:
        </p>
        <Eq tag="A.2">{String.raw`\hat{x}_1 = x_t + (1 - t)\, v_\theta(x_t, t, c), \qquad c = \text{“a high quality photo”}`}</Eq>
        <FigureRow
          label="Fig. A3"
          columns={7}
          items={[
            { entry: fig('a13-t0.25-original'), label: 'original' },
            { entry: fig('a13-t0.25-noisy'), label: 'noisy, 0.25' },
            { entry: fig('a13-t0.25-onestep'), label: 'one step' },
            { entry: fig('a13-t0.50-noisy'), label: 'noisy, 0.50' },
            { entry: fig('a13-t0.50-onestep'), label: 'one step' },
            { entry: fig('a13-t0.75-noisy'), label: 'noisy, 0.75' },
            { entry: fig('a13-t0.75-onestep'), label: 'one step' },
          ]}
          caption="Original, then each noisy input followed by its one-step estimate."
          meta="model output · one_step_0.25.png, one_step_0.5.png, one_step_0.75.png"
        />
        <p>
          Much better than the blur. At <M>{String.raw`t = 0.25`}</M> it is a believable night scene, but not my house: the left
          gable and porch are gone and the edges are smeared sideways. At <M>{String.raw`t = 0.5`}</M> the structure is right with
          fine texture smoothed away, and at <M>{String.raw`t = 0.75`}</M> it is very close to the original.
        </p>
        <p>
          The smoothness makes sense. With one step and a squared-error loss, the best guess is the average of every
          clean image that fits the noisy input, and averages are blurry.
        </p>
      </Section>

      {/* ------------------------------------------------------------ 1.4 */}
      <Section id="a-1-4" num="1.4" title="Visualizing Velocity">
        <p>
          Here I looked directly at what the model adds in that one step. Since I kept the noise from 1.1, I also
          know exactly what should be added:
        </p>
        <Eq>{String.raw`\underbrace{(1 - t)\,\hat{v}_t}_{\text{predicted update}}, \qquad \underbrace{(1 - t)\,v_{\text{gt}} = x_1 - x_t}_{\text{ground-truth update}}, \qquad v_{\text{gt}} = x_1 - \epsilon`}</Eq>
        <p>The error heatmap is the RMS difference across RGB at each pixel, computed before any display scaling:</p>
        <Eq>{String.raw`E_t = \sqrt{\operatorname{mean}_{\text{RGB}}\!\Big(\big[(1 - t)(\hat{v}_t - v_{\text{gt}})\big]^2\Big)}`}</Eq>
        <p>
          Both updates share one symmetric color scale with zero at middle gray, and all three error maps use the
          same <code>vmax</code> so they can be compared directly.
        </p>
        <Figure
          entry={fig('a14-original')}
          size="small"
          label="Fig. A4"
          caption="The original image, shown once."
        />
        {(['0.25', '0.50', '0.75'] as const).map((t, i) => (
          <Figure
            key={t}
            entry={fig(`a14-t${t}`)}
            size="wide"
            label={`Fig. A${5 + i}`}
            caption={`t = ${t}: noisy input, predicted update (1 − t)v̂, ground-truth update (1 − t)v_gt, and RGB RMS error.`}
          />
        ))}
        <p>
          At <M>{String.raw`t = 0.25`}</M> the error sits on edges: the house outline, window frames, tree crowns and fence
          pickets, while the flat sky stays dark. The predicted update is also softer than the ground truth, so the
          model gets the layout right but is unsure exactly where the edges go.
        </p>
        <p>
          As <M>{String.raw`t`}</M> grows the heatmaps get darker, partly from the <M>{String.raw`(1 - t)`}</M> factor and partly because there
          is less left to guess.
        </p>
      </Section>

      {/* ------------------------------------------------------------ 1.5 */}
      <Section id="a-1-5" num="1.5" title="Iterative Denoising with Euler Sampling">
        <p>
          The velocity depends on where you are along the path, so one big jump uses a stale direction for most of
          the trip. Euler integration takes a small step, asks the model again, and repeats:
        </p>
        <Eq tag="A.3">{String.raw`x_{t+h} = x_t + h\, v_\theta(x_t, t, c), \qquad h = 0.02`}</Eq>
        <p>
          My <code>euler_sample</code> recomputes the velocity every step and shortens the last step so it lands
          exactly on <M>{String.raw`t = 1`}</M>. Starting from the <M>{String.raw`t = 0.5`}</M> input takes 25 updates.
        </p>
        <FrameScrubber
          label="Fig. A8"
          title="Euler trajectory, h = 0.02"
          stageWidth="34rem"
          frames={['0.50', '0.60', '0.70', '0.80', '0.90', '1.00'].map((t) => ({
            entry: fig(`a15-euler-t${t}`),
            label: `t = ${t}`,
          }))}
          caption="The Euler trajectory from t = 0.50: the initial state, every fifth update, and the final image. Press play to watch it settle."
          meta="model output · trajectory.png"
        />
        <FigureRow
          label="Fig. A9"
          columns={4}
          items={[
            { entry: fig('a15-compare-original'), label: 'original' },
            { entry: fig('a15-compare-blur'), label: 'Gaussian blur, σ = 4' },
            { entry: fig('a15-compare-onestep'), label: 'one step' },
            { entry: fig('a15-compare-euler'), label: 'Euler, 25 steps' },
          ]}
          caption="All three methods on the same t = 0.50 input."
          meta="comparison.png"
        />
        <p>
          The final image is much sharper than the one-step estimate: the clouds have texture again and the siding
          and fence have real edges. It is also not quite my house. A small red object shows up in the middle tree
          around <M>{String.raw`t = 0.6`}</M> and a couple of windows shift, so the sampler committed to details that look
          plausible but were not in the photo.
        </p>
      </Section>

      {/* ------------------------------------------------------------ 1.6 */}
      <Section id="a-1-6" num="1.6" title="Generating Images from Noise">
        <p>
          Setting <M>{String.raw`t_{\text{start}} = 0`}</M> and passing pure noise turns the same sampler into a generator. I drew
          five independent noise tensors (seeds 180 to 184) and ran 50 Euler steps with the prompt “a high quality
          photo” and no guidance.
        </p>
        <FigureRow
          label="Fig. A10"
          columns={5}
          items={seeds.map((s) => ({ entry: fig(`a16-seed${s}`), label: `seed ${s}` }))}
          caption="Five samples from pure noise, “a high quality photo”, no guidance, h = 0.02."
          meta="model output · conditional_0.png … conditional_4.png"
        />
        <p>
          Every one is a person: five portraits, mostly head and shoulders against a plain wall. I did not expect
          the generic prompt to be this biased, and it shows up again in 3.1. Quality is mixed. Seeds 182 and 184 are
          believable, but seed 180's face has no features, seed 183 has a melted mustache, and seed 181's torso has
          strange rippled texture.
        </p>
      </Section>

      {/* ------------------------------------------------------------ 2.1 */}
      <Section id="a-2-1" num="2.1" title="Classifier-Free Guidance">
        <p>
          CFG evaluates the model twice per step on the same <M>{String.raw`x_t`}</M> and <M>{String.raw`t`}</M>: once with the prompt (
          <M>{String.raw`v_c`}</M>) and once with the empty string (<M>{String.raw`v_u`}</M>). Then it pushes past the conditional prediction,
          away from the unconditional one:
        </p>
        <Eq tag="A.4">{String.raw`v_{\text{cfg}} = v_c + w\,(v_c - v_u), \qquad w = 7`}</Eq>
        <p>I reused the same five starting noises from 1.6 so the comparison is one to one.</p>
        <FigureRow
          label="Fig. A11"
          columns={5}
          items={seeds.map((s) => ({ entry: fig(`a21-seed${s}`), label: `seed ${s}, w = 7` }))}
          caption="The same five noises with classifier-free guidance, w = 7."
          meta="model output · cfg_0.png … cfg_4.png"
        />
        <p>
          Same starting points, much more reliable. All five are clean studio portraits with centered faces and
          even lighting. The featureless face from seed 180 becomes a normal young man, and seed 182 keeps its raised
          hand, so the noise still controls the composition.
        </p>
        <p>
          The cost is variety. With <M>{String.raw`w = 7`}</M> they look like five shots from the same photographer: same framing,
          same pose, higher contrast. Guidance pulls every sample toward the most prompt-like answer, which here is a
          stock headshot.
        </p>
      </Section>

      {/* ------------------------------------------------------------ creative applications */}
      <header id="creative" className="part-break flow" data-toc>
        <p className="eyebrow">Part A · section 3</p>
        <h2 className="part-break__title">Creative applications</h2>
        <p>Same sampler, used to edit images and make illusions.</p>
      </header>

      {/* ------------------------------------------------------------ 3.1 */}
      <Section id="a-3-1" num="3.1" title="Image-to-Image Editing" ambient="forest" motif={<Frog title="Keroppi-style frog doodle" />}>
        <MarginPlate
          src="images/decorative/haeckel-frog-detail.webp"
          w={420}
          h={437}
          caption="Haeckel, Batrachia, 1904"
        />
        <p>
          Editing is the same sampler started late, in the spirit of SDEdit. I noise the input to a starting time
          with fixed noise (seed 180) and integrate to <M>{String.raw`t = 1`}</M> with CFG:
        </p>
        <Eq>{String.raw`x_{t_{\text{start}}} = (1 - t_{\text{start}})\,\epsilon + t_{\text{start}}\,x_1 \;\longrightarrow\; \text{Euler with } v_{\text{cfg}} \text{ from } t_{\text{start}} \text{ to } 1`}</Eq>
        <p>
          A small <M>{String.raw`t_{\text{start}}`}</M> leaves the model a lot of freedom, and a large one keeps most of the input.
        </p>
        <Params
          items={[
            ['t_start', '0.02, 0.04, 0.06, 0.10, 0.14, 0.25, 0.50'],
            ['prompt', 'a high quality photo'],
            ['w', '7'],
            ['noise', 'seed 180'],
          ]}
        />
        <p className="screen-only reading-hint">
          Hover, tap, or use the arrow keys on each strip to look at one starting time up close. Click any image to
          see the original notebook figure.
        </p>
        <p>
          At <M>{String.raw`t = 0.02`}</M> almost every subject turned into a portrait of a person, the same bias as in 1.6.
        </p>

        <SubHead>The Campanile and my two photos</SubHead>
        <EditTimeline section="3.1" group="campanile" title="Campanile" kicker="provided image" label="Fig. A12" initial="0.14" />
        <p>
          At 0.02 there is only a smooth white cylinder against a blurry blue background. From 0.04 to 0.06 it is a
          white tapering tower among trees, and at 0.10 and 0.14 a plain obelisk with a single window. The belfry
          arches come back at 0.25, and the clock hands only at 0.50.
        </p>
        <EditTimeline section="3.1" group="nighthouse" title="Night house" kicker="my photo" label="Fig. A13" initial="0.14" />
        <p>
          My favorite progression. 0.02 is a woman's portrait, 0.04 is a hand holding a card in front of a gray
          wall, and 0.06 is a glowing doorway over a wooden floor. At 0.10 and 0.14 the model has picked up the moon
          and the dark horizon and made a moonlit field with trees and a single glowing light. The house appears at
          0.25 with different siding and windows, and 0.50 is basically my photo.
        </p>
        <EditTimeline section="3.1" group="eye" title="Eye close-up" kicker="my photo" label="Fig. A14" initial="0.06" />
        <p>
          At 0.02 and 0.04 it is a man's face with blank white eyes and then someone asleep under a cap. By 0.06 it
          is a close-up of an eye again, but a blue one. The green iris and the heavy lashes return gradually from
          0.14 to 0.25.
        </p>

        <SubHead>An image from the web</SubHead>
        <EditTimeline section="3.1" group="orange-cat" title="Orange cat" kicker="image from the web" label="Fig. A15" initial="0.14" />
        <p>
          The clearest jump of the set. At 0.02 and 0.04 it is a man in a white T-shirt next to the bars, and at
          0.06 a hand gripping one of the bars. At 0.10 the cat is back, but as a smooth, almost cartoon cat with
          huge glassy eyes. Real fur texture only returns from 0.14 on.
        </p>
        <Sketchbook
          title="from my sketchbook"
          kicker="my own drawings"
          intro={
            <p>
              My own drawings. They are flat with clean lines, so it is easy to see where the model throws the
              drawing away and where it tries to turn it into a photo.
            </p>
          }
        >
          <EditTimeline section="3.1" group="malfoy" title="Malfoy" kicker="my drawing" label="Fig. A16" initial="0.10" />
          <p>
            This one gave the most convincing “make it real” result I found. 0.02 is a man's portrait printed on a
            panel, and 0.04 and 0.06 are a hand holding a card and then a phone. At 0.10 and 0.14 the drawing becomes
            a photo of a blonde woman in a black sweater with her chin on her hand, and the house crest turns into a
            potted plant. At 0.25 it is a drawing again and the crest is back.
          </p>
          <EditTimeline section="3.1" group="keroppi" title="Keroppi" kicker="my drawing" label="Fig. A17" initial="0.14" />
          <p>
            Keroppi had the strangest path. 0.02 is a man's face, and 0.04 and 0.06 are a gray panel with a white cup
            in the corner and fake lettering. At 0.10 and 0.14 the model finds the frog's layout and makes a product
            photo of a Keroppi-shaped object: a gray box with two eyes, an X-shaped mouth, a pair of shorts and white
            sneakers. 0.25 is a colorless pencil sketch with scribbled text, and the colors come back at 0.50.
          </p>

          <p className="sketchbook__note">Jeanne, twice</p>
          <p>
            The center crop cut off the top of my Jeanne drawing, so I also ran it padded to a square with a light
            pink border.
          </p>
          <EditTimeline section="3.1" group="jeanne" title="Jeanne, center crop" kicker="my drawing" label="Fig. A18" initial="0.14" extra />
          <p>
            0.02 is a portrait, and 0.04 to 0.10 are crumpled paper, fabric and a pencil. At 0.14 the red trim of the
            jacket gets reinterpreted as a face cut out of red paper, with the lips and an eye made from the trim. At
            0.25 it is a pen drawing again with the face and hands redrawn, and 0.50 is faithful.
          </p>
          <EditTimeline section="3.1" group="jeanne-full" title="Jeanne, padded to a square" kicker="my drawing" label="Fig. A19" initial="0.25" extra />
          <p>
            With the border, the model read the whole frame as a photo of a printed object: 0.02 and 0.04 are
            portraits printed on things, 0.06 and 0.10 are books with fake lettering. The intermediate times were the
            interesting ones. 0.14 is a pink-tinted photo of an old man looking up, and 0.25 is a sketch of a young
            man with pink hair and the same red accents. Only 0.50 is clearly Jeanne.
          </p>
        </Sketchbook>
        <Pond />
      </Section>

      {/* ------------------------------------------------------------ 3.2 */}
      <Section id="a-3-2" num="3.2" title="Text-Guided Image Editing" ambient="forest">
        <p>
          Same procedure and starting times, but with my own prompts (printed above each sweep). With a small{' '}
          <M>{String.raw`t_{\text{start}}`}</M> the prompt wins outright and with a large one the original wins, so the interesting
          results are in between.
        </p>
        <EditTimeline
          section="3.2"
          group="campanile"
          title="Campanile → rocket"
          prompt={fig('a32-campanile-0.02').prompt}
          label="Fig. A20"
          initial="0.10"
        />
        <p>
          0.02 to 0.06 are complete rockets on launch pads with pine trees, which is the prompt with no Campanile
          left. At 0.10 and 0.14 the rocket has exactly the tower's taper and position, and the belfry window becomes
          a band of panels. 0.25 is my favorite: the arched belfry sits on top of a white rocket body with a launch
          gantry beside it. At 0.50 the prompt barely does anything.
        </p>
        <EditTimeline
          section="3.2"
          group="nighthouse"
          title="Night house → haunted mansion"
          prompt={fig('a32-nighthouse-0.02').prompt}
          label="Fig. A21"
          initial="0.14"
        />
        <p>
          Everything up to 0.10 is a full Gothic mansion with swirling clouds and a huge moon. Even there, the
          original leaks through: the moon stays roughly where the moon in my photo is. At 0.14 my fence shows up in
          front of the mansion, at 0.25 the mansion takes on my house's layout and porch light, and 0.50 is my house
          with more dramatic clouds.
        </p>
        <EditTimeline
          section="3.2"
          group="eye"
          title="Eye → galaxy iris"
          prompt={fig('a32-eye-0.02').prompt}
          label="Fig. A22"
          initial="0.14"
        />
        <p>
          This prompt held on the longest. Every starting time up to 0.25 has a galaxy in the iris. At low times
          the nebula spills out over the eyelid. At 0.25 the galaxy sits inside my iris and even keeps the curved
          highlight from the original photo. At 0.50 there are only a few star specks in a normal iris.
        </p>
        <p>
          So edit strength is not only about <M>{String.raw`t_{\text{start}}`}</M>. A prompt that fits the original's shape (a
          galaxy in a round iris) lasted longer than one that needs a different silhouette (a tall mansion on a low
          house).
        </p>
      </Section>

      {/* ------------------------------------------------------------ 3.3 */}
      <Section
        id="a-3-3"
        num="3.3"
        title="Visual Anagrams"
        className="section--night"
        ambient="night"
        motif={<Cat title="Black cat silhouette" />}
        scene={
          <>
            <WaveEdge position="top" />
            <Fireflies />
          </>
        }
      >
        <div className="night-moon" aria-hidden="true">
          <img src={asset('images/decorative/steinlen-chat-noir-cat.webp')} alt="" width={440} height={440} loading="lazy" />
          <span>after Steinlen, 1896</span>
        </div>
        <p>
          A visual anagram is one image that reads as one prompt upright and a different prompt upside down. At
          every Euler step I predict a CFG velocity for the upright image with prompt <M>{String.raw`p_1`}</M>, predict another for
          the rotated image with prompt <M>{String.raw`p_2`}</M>, rotate that one back, and average:
        </p>
        <Eq>{String.raw`v_1 = v_{\text{cfg}}(x_t, t, p_1), \qquad v_2 = F\big(v_{\text{cfg}}(F(x_t), t, p_2)\big), \qquad v = \tfrac{1}{2}(v_1 + v_2)`}</Eq>
        <p>
          <M>{String.raw`F`}</M> is a 180° rotation (<code>torch.flip(x, (-2, -1))</code>). Each anagram starts from pure noise and
          takes 50 Euler steps. These are the four I picked.
        </p>
        <p className="screen-only reading-hint">Use the turn button on each artwork. The pair underneath is the two saved files.</p>
        <div className="anagram-list">
          <AnagramViewer group="old-man-campfire" index="i" name="Old man ↔ people around a campfire" label="Fig. A23">
            <p>
              The provided example. The rotated view is the stronger one: three figures lit from below by a fire,
              and the fire is the old man's glowing forehead. Upright, his face reads but it is busy. Looking at
              his chin I can see small upside-down faces from the campfire scene.
            </p>
          </AnagramViewer>
          <AnagramViewer group="village-horse" index="ii" name="Snowy mountain village ↔ horse" label="Fig. A24" reverse>
            <p>
              Also provided. Upright it is a village under mountains, and the horse's head hides at the bottom,
              upside down, pretending to be part of a roof. Rotated, the horse is surprisingly clean and the village
              turns into fences and a snowy background.
            </p>
          </AnagramViewer>
          <AnagramViewer group="cat-ocean" index="iii" name="Black cat ↔ ocean waves" label="Fig. A25">
            <p>
              My own pair, and it worked much better than I expected. Upright it is a cat's face with gold eyes and
              two big ears, framed by white foam. Turned over, the ears become dark rocks in the surf and the eyes
              become two smaller rocks. Rotating it actually changes what I notice first.
            </p>
            <p>
              The cat came out deep blue instead of black since both prompts had to share one palette, and the ocean
              side reads more as rocks in dark water than crashing waves.
            </p>
          </AnagramViewer>
          <AnagramViewer group="volcano-wine" index="iv" name="Erupting volcano ↔ glass of red wine" label="Fig. A26" reverse>
            <p>
              My other favorite (seed 190, run in its own cell). Both prompts want a dark mass with a glowing line
              through it. Upright, the bowl of the glass is the dark cone of the volcano and the stem is the glowing
              eruption column. Rotated, the cone becomes a bowl of red wine and the lava becomes the lit stem. Both
              readings are immediate.
            </p>
          </AnagramViewer>
        </div>
        <NightShore />
        <WaveEdge position="bottom" />
      </Section>

      {/* ------------------------------------------------------------ 3.4 */}
      <Section
        id="a-3-4"
        num="3.4"
        title="Hybrid Images"
        className="section--glass"
        ambient="glass"
        motif={<Butterfly title="Butterfly line drawing" />}
        scene={<Caustics tone="glass" />}
      >
        <MarginPlate
          src="images/decorative/haeckel-tineida-plate.webp"
          w={900}
          h={1271}
          caption="Haeckel, Tineida, 1904"
        />
        <p>
          Hybrid images mix the low frequencies of one prompt with the high frequencies of another, like Project 2,
          except the mixing happens inside the sampler on the velocity. Both CFG predictions use the same{' '}
          <M>{String.raw`x_t`}</M> and <M>{String.raw`t`}</M>:
        </p>
        <Eq>{String.raw`v_{\text{hybrid}} = \operatorname{LP}(v_a) + v_b - \operatorname{LP}(v_b)`}</Eq>
        <p>
          <M>{String.raw`\operatorname{LP}`}</M> is the provided Gaussian low-pass (<M>{String.raw`\sigma = 16`}</M>, 265 × 265 kernel). Prompt{' '}
          <M>{String.raw`a`}</M> sets the layout you see from far away and prompt <M>{String.raw`b`}</M> supplies the detail up close. The far
          view is the 64 × 64 downsample from the notebook.
        </p>
        <p className="screen-only reading-hint">
          Drag “viewing distance” to step back from each image. At the far end the slider swaps in the saved 64 × 64
          file.
        </p>
        <div className="hybrid-list">
          <HybridViewer group="skull-waterfall" index="i" name="Skull × waterfall" label="Fig. A27">
            <p>
              The provided example. Up close it is a lovely ink-wash waterfall inside a rounded vignette. From far
              away the skull is faint. The rounded vignette gives a cranium shape and the dark cliff and falls sit
              roughly where the eye sockets and nose would be, but I mostly see it because I know to look.
            </p>
          </HybridViewer>
          <HybridViewer group="cat-forest" index="ii" name="Cat × forest" label="Fig. A28">
            <p>
              Also provided. Up close it is clearly a forest drawn on old paper. From far away the two pale tree
              crowns at the top become ears and the trunks fill in a face. Subtle, but it reads better than the
              skull.
            </p>
          </HybridViewer>
          <HybridViewer group="hourglass-beach" index="iii" name="Hourglass × ocean waves and sand" label="Fig. A29">
            <p>
              My own pair. Up close it is a column of breaking waves between two dark posts, with sand dunes at
              the bottom. From far away the waves disappear and what remains is the frame of an hourglass: dark
              posts, a bright center and a mound of sand. It is more an hourglass frame than a glass bulb, but I
              like that the sand from both prompts became the same dunes.
            </p>
          </HybridViewer>
          <HybridViewer group="butterfly-glass" index="iv" name="Butterfly × stained glass" label="Fig. A30">
            <p>
              The one that worked best. Up close it is three Gothic windows with colored glass and lead lines. From
              far away the two large windows become wings and the small middle window becomes the body. It is
              clearly a symmetric butterfly.
            </p>
          </HybridViewer>
        </div>

        <SubHead className="subhead--glass">
          <span>Human face</span>
          <span className="subhead__glass">
            <Lancet />
            <span className="subhead__x">×</span>
          </span>
          <span>clockwork</span>
        </SubHead>
        <div className="clockwork">
          <HybridViewer group="face-clockwork" index="v" name="Face × clockwork, first run" label="Fig. A31" compact>
            <p>
              From far away it is clearly a face. Up close it is still clearly a face. The gears are there, around
              the edge of the head and stacked at the neck, but they frame the face instead of covering it.
            </p>
          </HybridViewer>
          <HybridViewer group="face-clockwork-revised" index="vi" name="Face × clockwork, revised prompts" label="Fig. A32" compact>
            <p>
              The revised run replaced both prompts. Up close it is all gears now, and from far away the face is
              still there, just fainter.
            </p>
          </HybridViewer>
        </div>
        <p>
          In the first run the face was too clear up close and the gears were not as prominent as I wanted, so for
          the second run I asked for “hundreds of interlocking clockwork gears and cogwheels filling the entire
          frame” and simplified the face prompt to “simple features, broad smooth shadows”.
        </p>
        <p>
          Up close the gears are everywhere now and look great. From far away I can still see the face, not as
          clearly as in the first run, but it still works pretty well. I like them both for different reasons: the
          first is the stronger face and the second is the better clockwork.
        </p>
      </Section>
    </>
  )
}
