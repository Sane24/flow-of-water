import { fig } from '../data/figures'
import { Figure, FigureRow, Meta } from '../components/Figure'
import { Eq, M } from '../components/Math'
import { Callout, Params, Section, SubHead } from '../components/Layout'
import { EditTimeline } from '../components/EditTimeline'
import { AnagramViewer } from '../components/AnagramViewer'
import { HybridViewer } from '../components/HybridViewer'
import { Butterfly, Cat, Frog, Lancet } from '../components/Motifs'

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
          At <M>{String.raw`t = 0`}</M> the result is pure noise and at <M>{String.raw`t = 1`}</M> it is the clean image. It is not just adding
          noise: the image term is scaled by <M>{String.raw`t`}</M> too, so at <M>{String.raw`t = 0.25`}</M> the house is a quarter-strength
          signal sitting under three-quarter-strength noise. My implementation is one line,{' '}
          <code>(1 - t) * noise + t * image</code>, and the notebook checks both endpoints exactly:
          interpolating at 0 returns <M>{String.raw`\epsilon`}</M> and at 1 returns the image.
        </p>
        <p>
          For Sections 1.1 through 1.5 I used my own night photo of a house instead of the Campanile. The supplied
          preprocessing center-crops it to 512 × 512 and maps RGB to <M>{String.raw`[-1, 1]`}</M>. I sampled a single noise
          tensor with seed 180 and reused it at all three times, so the only thing changing across the row is{' '}
          <M>{String.raw`t`}</M>.
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
          At <M>{String.raw`t = 0.25`}</M> the photo is almost all static. I can only find a lighter patch where the moon is and a
          faint warm spot from the lit window. By <M>{String.raw`t = 0.5`}</M> the roofline, the trees and the fence are readable.
          At <M>{String.raw`t = 0.75`}</M> everything is there, just grainy.
        </p>
      </Section>

      {/* ------------------------------------------------------------ 1.2 */}
      <Section id="a-1-2" num="1.2" title="Classical Denoising">
        <p>
          Before using the model, I tried the obvious baseline: blur the noise away. Since the image inside{' '}
          <M>{String.raw`x_t`}</M> is scaled down by <M>{String.raw`t`}</M>, I first divide by <M>{String.raw`t`}</M> to restore its brightness, then apply a
          Gaussian filter <M>{String.raw`G_\sigma`}</M>:
        </p>
        <Eq>{String.raw`\frac{x_t}{t} = x_1 + \frac{1 - t}{t}\,\epsilon, \qquad \hat{x}_1^{\text{blur}} = G_\sigma\!\left(\frac{x_t}{t}\right)`}</Eq>
        <p>
          The division only fixes the amplitude. It scales the noise up by the same factor, so at{' '}
          <M>{String.raw`t = 0.25`}</M> the noise term is three times as strong as the image. Averaging nearby pixels cancels
          some of that independent noise, but it averages away edges too.
        </p>
        <p>
          The notebook sweeps <M>{String.raw`\sigma \in \{1, 2, 4, 8, 16\}`}</M> and keeps the one with the lowest MSE against the
          clean image. That is a little unfair to the real world (a real denoiser would not know the clean image),
          but it shows the best this baseline can do. The winners were <M>{String.raw`\sigma = 16`}</M> at <M>{String.raw`t = 0.25`}</M>,{' '}
          <M>{String.raw`\sigma = 4`}</M> at <M>{String.raw`t = 0.5`}</M>, and <M>{String.raw`\sigma = 1`}</M> at <M>{String.raw`t = 0.75`}</M>. That ordering makes sense:
          the noisier the input, the wider the blur has to be before removing noise beats destroying detail.
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
          At <M>{String.raw`t = 0.25`}</M> the best blur is colored blobs: the moon is a smear and the house is a warm patch. At{' '}
          <M>{String.raw`t = 0.5`}</M> the shapes come back but the windows and fence turn to mush. At <M>{String.raw`t = 0.75`}</M> the{' '}
          <M>{String.raw`\sigma = 1`}</M> result looks fine at a glance and still has visible grain, because any more blur would
          have cost more error at the edges than it saved in the flat regions.
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
        <p>
          Before trusting it I checked that the returned velocity had the same shape, dtype and device as the input
          and contained no NaNs. Then I ran exactly one prediction on each of the three saved noisy images.
        </p>
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
          This is a huge jump over the blur. At <M>{String.raw`t = 0.25`}</M> the estimate is a believable night scene with a
          moon, trees and a lit house, but it is not my house. The left gable and porch are gone, the facade is
          simplified into a generic two-story box, and the edges are smeared sideways like a long exposure. At{' '}
          <M>{String.raw`t = 0.5`}</M> the structure is correct: roofline, chimney, the bright doorway and the fence, with fine
          texture smoothed away, especially in the clouds. At <M>{String.raw`t = 0.75`}</M> it is very close to the original.
        </p>
        <p>
          The smoothness is expected. With one step, the best the model can do under a squared-error objective is
          predict the average of every clean image consistent with the noisy input, and averages are blurry.
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
          My <code>velocity_diagnostics</code> function returns both updates with shape (B, 3, H, W) and the error
          map with shape (B, H, W), averaging only over the channel dimension. Both updates are drawn on one shared
          symmetric RGB scale with zero at middle gray, which is why they look like faded photos. The error maps
          use a linear scale with <code>vmin = 0</code> and the same <code>vmax</code> (the largest error over all
          three times) in every panel, so the three heatmaps can be compared directly. The figures below are the
          unmodified notebook plots.
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
          At <M>{String.raw`t = 0.25`}</M> the error is concentrated on edges: the outline of the house, the window frames, the
          tree crowns and the individual fence pickets. The flat sky stays dark. The predicted update is also
          visibly softer than the ground truth, which contains every board of the siding. That matches what I saw in
          1.3: the model gets the low-frequency layout right and is unsure where exactly the edges go.
        </p>
        <p>
          As <M>{String.raw`t`}</M> grows the heatmaps get darker overall. Part of that is the <M>{String.raw`(1 - t)`}</M> factor shrinking the
          update, and part is that there is simply less left to guess. At <M>{String.raw`t = 0.75`}</M> only a faint trace of the
          edges remains.
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
          My <code>euler_sample</code> recomputes the velocity at every step, shortens the last step with{' '}
          <code>h = min(step_size, 1 - t)</code> so it lands exactly on <M>{String.raw`t = 1`}</M>, and saves the starting state,
          every fifth update, and the final state. The notebook tests it on a constant velocity field from{' '}
          <M>{String.raw`t = 0`}</M>, <M>{String.raw`0.5`}</M> and <M>{String.raw`0.93`}</M>, expecting 50, 25 and 4 calls (the last one needs a shortened
          step) and an endpoint of exactly <M>{String.raw`1 - t_{\text{start}}`}</M>. All three passed. Starting from the saved{' '}
          <M>{String.raw`t = 0.5`}</M> input takes 25 updates.
        </p>
        <FigureRow
          label="Fig. A8"
          columns={6}
          items={['0.50', '0.60', '0.70', '0.80', '0.90', '1.00'].map((t) => ({
            entry: fig(`a15-euler-t${t}`),
            label: `t = ${t}`,
          }))}
          caption="The Euler trajectory from t = 0.50: the initial state, every fifth update, and the final image."
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
          The trajectory clears up gradually. By <M>{String.raw`t = 0.8`}</M> the house and trees are crisp and only the sky still
          has grain. The final image is much sharper than the one-step estimate: the clouds have texture again and
          the siding and fence have real edges.
        </p>
        <p>
          It is also not quite my house. A small red object appears near the top of the middle tree around{' '}
          <M>{String.raw`t = 0.6`}</M> and stays to the end, the tree on the right changes shape, and a couple of windows shift.
          The sampler committed to specific details that look plausible but were not in the photo.
        </p>
        <Callout title="The numbers disagree with my eyes">
          <p>
            The notebook logged the MSE to the original for each method on this input: Gaussian blur{' '}
            <strong>0.0253</strong>, one step <strong>0.0071</strong>, Euler <strong>0.0086</strong>. So Euler is
            slightly worse than one step by MSE, even though it clearly looks better. I think that is the same
            averaging story again: the one-step estimate hedges toward the mean, which is exactly what minimizes
            squared error, while Euler commits to one sharp possibility and pays for every detail it guesses
            differently.
          </p>
        </Callout>
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
          Every single one is a person. Not a landscape, not an object: five portraits, mostly head and shoulders
          against a plain wall. I did not expect the generic prompt to be this biased, but a lot of photos labeled
          as high quality are probably portraits, and that preference shows up again in Section 3.1.
        </p>
        <p>
          The quality is mixed. Seeds 182 and 184 are believable. Seed 180 has a face that dissolves into skin with
          no features, seed 183 is a distorted face with a melted mustache, and the torso in seed 181 has strange
          rippled texture. Without guidance the model seems to hedge between several possibilities at once, and the
          result can be anatomically mushy.
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
        <p>
          With <M>{String.raw`w = 0`}</M> this reduces to ordinary conditional sampling, and the notebook asserts that exactly.
          Each Euler step now costs two model calls. I reused the same five starting noises from 1.6 so the
          comparison is one to one.
        </p>
        <FigureRow
          label="Fig. A11"
          columns={5}
          items={seeds.map((s) => ({ entry: fig(`a21-seed${s}`), label: `seed ${s}, w = 7` }))}
          caption="The same five noises with classifier-free guidance, w = 7."
          meta="model output · cfg_0.png … cfg_4.png"
        />
        <p>
          Same starting points, completely different reliability. All five are clean, sharp studio portraits:
          centered faces, even lighting, plain backgrounds, most of them smiling at the camera. The featureless face
          from seed 180 becomes a normal young man, and the distorted face from seed 183 becomes a well-lit
          portrait. Seed 182 kept the raised hand from its unguided version, so the noise still controls the
          composition.
        </p>
        <p>
          The cost is variety. Without guidance the set had different crops, a shirtless torso, and both warm and
          cool palettes. With <M>{String.raw`w = 7`}</M> they look like five shots from the same photographer: same framing, same
          pose, higher contrast, slightly oversaturated skin. Guidance pulls every sample toward the most
          prompt-like answer, which here means a stock headshot.
        </p>
      </Section>

      {/* ------------------------------------------------------------ 3.1 */}
      <Section id="a-3-1" num="3.1" title="Image-to-Image Editing" motif={<Frog title="Keroppi-style frog doodle" />}>
        <p>
          Editing is the same sampler started late, in the spirit of SDEdit. I noise the input to a starting time
          with fixed noise (seed 180) and integrate to <M>{String.raw`t = 1`}</M> with CFG:
        </p>
        <Eq>{String.raw`x_{t_{\text{start}}} = (1 - t_{\text{start}})\,\epsilon + t_{\text{start}}\,x_1 \;\longrightarrow\; \text{Euler with } v_{\text{cfg}} \text{ from } t_{\text{start}} \text{ to } 1`}</Eq>
        <p>
          A small <M>{String.raw`t_{\text{start}}`}</M> leaves almost nothing of the input, so the model has a lot of freedom. A
          large one keeps most of it. Starting at 0.02 takes 49 steps and starting at 0.50 takes 25. Everything in
          this section uses the prompt “a high quality photo”, <M>{String.raw`w = 7`}</M> and <M>{String.raw`h = 0.02`}</M>.
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
          One pattern shows up across almost every subject: at <M>{String.raw`t = 0.02`}</M>, the night house, the eye, the orange
          cat, Keroppi and the Jeanne crop all turned into portraits of a person. That is the same bias from 1.6.
          With almost no information left, the model falls back on its favorite kind of “high quality photo”.
        </p>

        <SubHead>The Campanile and my two photos</SubHead>
        <EditTimeline section="3.1" group="campanile" title="Campanile" kicker="required · provided image" label="Fig. A12" initial="0.10" />
        <p>
          At 0.02 there is only a smooth white cylinder against a blurry blue background. From 0.04 to 0.06 it is a
          white tapering tower among trees, and at 0.10 and 0.14 a plain obelisk with a single window. The belfry
          arches come back at 0.25, and the clock hands only at 0.50.
        </p>
        <EditTimeline section="3.1" group="nighthouse" title="Night house" kicker="required · my photo" label="Fig. A13" initial="0.14" />
        <p>
          My favorite progression. 0.02 is a woman's portrait, 0.04 is a hand holding a card in front of a gray
          wall, and 0.06 is a glowing doorway over a wooden floor. At 0.10 and 0.14 the model has picked up the moon
          and the dark horizon and made a moonlit field with trees and a single glowing light. The house appears at
          0.25 with different siding and windows, and 0.50 is basically my photo.
        </p>
        <EditTimeline section="3.1" group="eye" title="Eye close-up" kicker="required · my photo" label="Fig. A14" initial="0.06" />
        <p>
          At 0.02 and 0.04 it is a man's face with blank white eyes and then someone asleep under a cap. By 0.06 it
          is a close-up of an eye again, but a blue one. The green iris and the heavy lashes return gradually from
          0.14 to 0.25.
        </p>

        <SubHead>A web image and my drawings</SubHead>
        <EditTimeline section="3.1" group="orange-cat" title="Orange cat" kicker="required · image from the web" label="Fig. A15" initial="0.10" />
        <p>
          The clearest jump of the set. At 0.02 and 0.04 it is a man in a white T-shirt next to the bars, and at
          0.06 a hand gripping one of the bars. At 0.10 the cat is back, but as a smooth, almost cartoon cat with
          huge glassy eyes. Real fur texture only returns from 0.14 on.
        </p>
        <EditTimeline section="3.1" group="malfoy" title="Malfoy" kicker="required · my drawing" label="Fig. A16" initial="0.14" />
        <p>
          Low starting times turn my drawing into photos of objects on a white desk: a hand on a black card, a
          newspaper. At 0.10 it becomes a black and white photo of someone in a dark robe, and at 0.14 a grayscale
          photo of a blonde person in the drawing's pose. It is a drawing again from 0.25, though that version lost
          most of the green.
        </p>
        <EditTimeline section="3.1" group="keroppi" title="Keroppi" kicker="required · my drawing" label="Fig. A17" initial="0.14" />
        <p>
          Keroppi had the strangest path. 0.02 is a man's face, and 0.04 and 0.06 are a gray panel with a white cup
          in the corner and fake lettering. At 0.10 and 0.14 the model finds the frog's layout and makes a product
          photo of a Keroppi-shaped object: a gray box with two eyes, an X-shaped mouth, a pair of shorts and white
          sneakers. 0.25 is a colorless pencil sketch with scribbled text, and the colors come back at 0.50.
        </p>

        <SubHead>Extra runs on my drawings</SubHead>
        <p>
          The preprocessing center-crops to a square, which cut off the top of my Jeanne drawing, so I ran the
          drawing twice: once with the default crop and once padded to a square with a light pink border using{' '}
          <code>ImageOps.pad</code>. I also tried a tighter crop of the Malfoy drawing.
        </p>
        <EditTimeline section="3.1" group="jeanne" title="Jeanne, center crop" kicker="extra · my drawing" label="Fig. A18" initial="0.14" extra />
        <p>
          0.02 is a portrait, and 0.04 to 0.10 are crumpled paper, fabric and a pencil. At 0.14 the red trim of the
          jacket gets reinterpreted as a face cut out of red paper, with the lips and an eye made from the trim. At
          0.25 it is a pen drawing again with the face and hands redrawn, and 0.50 is faithful.
        </p>
        <EditTimeline section="3.1" group="jeanne-full" title="Jeanne, padded to a square" kicker="extra · my drawing" label="Fig. A19" initial="0.25" extra />
        <p>
          With the border, the model read the whole frame as a photo of a printed object: 0.02 and 0.04 are
          portraits printed on things, 0.06 and 0.10 are books with fake lettering. The intermediate times were the
          interesting ones. 0.14 is a pink-tinted photo of an old man looking up, and 0.25 is a sketch of a young
          man with pink hair and the same red accents. Only 0.50 is clearly Jeanne.
        </p>
        <EditTimeline section="3.1" group="malfoy-crop" title="Malfoy, tighter crop" kicker="extra · my drawing" label="Fig. A20" initial="0.10" extra />
        <p>
          This crop gave the most convincing “make it real” result I found. At 0.10 and 0.14 the drawing becomes a
          photo of a blonde woman in a black sweater with her chin on her hand, and the house crest turns into a
          potted plant. At 0.25 it is a drawing again and the crest is back.
        </p>
      </Section>

      {/* ------------------------------------------------------------ 3.2 */}
      <Section id="a-3-2" num="3.2" title="Text-Guided Image Editing">
        <p>
          Same procedure, same seven starting times, but the generic prompt is replaced with my own. The exact
          prompt strings from the notebook are printed above each sweep.
        </p>
        <p>
          With a small <M>{String.raw`t_{\text{start}}`}</M> the prompt wins outright; with a large one the original wins. The
          results I care about are in between, where the prompt has to work with the original's layout.
        </p>
        <EditTimeline
          section="3.2"
          group="campanile"
          title="Campanile → rocket"
          prompt={fig('a32-campanile-0.02').prompt}
          label="Fig. A21"
          initial="0.25"
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
          label="Fig. A22"
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
          label="Fig. A23"
          initial="0.25"
        />
        <p>
          This prompt held on the longest. Every starting time up to 0.25 has a galaxy in the iris. At low times
          the nebula spills out over the eyelid. At 0.25 the galaxy sits inside my iris and even keeps the curved
          highlight from the original photo. At 0.50 there are only a few star specks in a normal iris.
        </p>
        <p>
          So the strength of an edit is not only about <M>{String.raw`t_{\text{start}}`}</M>. A prompt that fits the original's
          structure (a galaxy inside a round iris) survived to a higher starting time than one that needs a
          different silhouette (a tall mansion in place of a low bungalow).
        </p>
      </Section>

      {/* ------------------------------------------------------------ 3.3 */}
      <Section id="a-3-3" num="3.3" title="Visual Anagrams" className="section--night" motif={<Cat title="Black cat silhouette" />}>
        <p>
          A visual anagram is one image that reads as one prompt upright and a different prompt upside down. At
          every Euler step I predict a CFG velocity for the upright image with prompt <M>{String.raw`p_1`}</M>, predict another for
          the rotated image with prompt <M>{String.raw`p_2`}</M>, rotate that one back, and average:
        </p>
        <Eq>{String.raw`v_1 = v_{\text{cfg}}(x_t, t, p_1), \qquad v_2 = F\big(v_{\text{cfg}}(F(x_t), t, p_2)\big), \qquad v = \tfrac{1}{2}(v_1 + v_2)`}</Eq>
        <p>
          <M>{String.raw`F`}</M> is a 180° rotation, which flips both spatial axes (<code>torch.flip(x, (-2, -1))</code>), not
          just a vertical mirror. Since <M>{String.raw`F`}</M> is its own inverse, the notebook checks{' '}
          <M>{String.raw`F(F(x)) = x`}</M>. Each anagram starts from pure noise and takes 50 Euler steps, with four model calls per
          step (two prompts, each conditional and unconditional). I ran six pairs; these are the four I picked.
        </p>
        <p className="screen-only reading-hint">Use the turn button on each artwork. The pair underneath is the two saved files.</p>
        <div className="anagram-list">
          <AnagramViewer group="old-man-campfire" index="i" name="Old man ↔ people around a campfire" label="Fig. A24">
            <p>
              The provided example. The rotated view is the stronger one: three figures lit from below by a fire,
              and the fire is the old man's glowing forehead. Upright, his face reads but it is busy. Looking at
              his chin I can see small upside-down faces from the campfire scene.
            </p>
          </AnagramViewer>
          <AnagramViewer group="village-horse" index="ii" name="Snowy mountain village ↔ horse" label="Fig. A25" reverse>
            <p>
              Also provided. Upright it is a village under mountains, and the horse's head hides at the bottom,
              upside down, pretending to be part of a roof. Rotated, the horse is surprisingly clean and the village
              turns into fences and a snowy background.
            </p>
          </AnagramViewer>
          <AnagramViewer group="cat-ocean" index="iii" name="Black cat ↔ ocean waves" label="Fig. A26">
            <p>
              My own pair, and it worked much better than I expected. Upright it is a cat's face with gold eyes and
              two big ears, framed by white foam. Turned over, the ears become dark rocks in the surf and the eyes
              become two smaller rocks. Rotating it actually changes what I notice first.
            </p>
            <p>
              Two honest caveats: the cat is not really black, it is deep ocean blue, because the prompts had to
              agree on one palette and the water won. And the ocean side reads more as rocks in dark water than
              as waves crashing.
            </p>
          </AnagramViewer>
          <AnagramViewer group="volcano-wine" index="iv" name="Erupting volcano ↔ glass of red wine" label="Fig. A27" reverse>
            <p>
              My other favorite (seed 190, run in its own cell). Both prompts want a dark mass with a glowing line
              through it. Upright, the bowl of the glass is the dark cone of the volcano and the stem is the glowing
              eruption column. Rotated, the cone becomes a bowl of red wine and the lava becomes the lit stem. Both
              readings are immediate.
            </p>
          </AnagramViewer>
        </div>
        <SubHead>Two pairs that did not work</SubHead>
        <FigureRow
          label="Fig. A28"
          columns={4}
          items={[
            { entry: fig('a33-eye-moon-upright'), label: 'upright: “a giant human eye”' },
            { entry: fig('a33-eye-moon-rotated'), label: 'rotated: “a moonlit sky…”' },
            { entry: fig('a33-hourglass-beach-upright'), label: 'upright: “an antique hourglass…”' },
            { entry: fig('a33-hourglass-beach-rotated'), label: 'rotated: “golden sand and ocean waves…”' },
          ]}
          caption="Seeds 183 and 184. Neither changes meaning when turned over."
          meta="model output · anagram_3.png, anagram_4.png (+ rotated)"
        />
        <p>
          The eye and moonlit sky pair is an eye in both orientations: a round iris is already close to symmetric
          under rotation, so the eye prompt could satisfy both views. The hourglass and beach pair failed for a
          similar reason, since an hourglass looks the same upside down. Only the strip of waves moves from the
          bottom to the top.
        </p>
      </Section>

      {/* ------------------------------------------------------------ 3.4 */}
      <Section id="a-3-4" num="3.4" title="Hybrid Images" motif={<Butterfly title="Butterfly line drawing" />}>
        <p>
          Hybrid images mix the low frequencies of one prompt with the high frequencies of another, like Project 2,
          except the mixing happens inside the sampler on the velocity. Both CFG predictions use the same{' '}
          <M>{String.raw`x_t`}</M> and <M>{String.raw`t`}</M>:
        </p>
        <Eq>{String.raw`v_{\text{hybrid}} = \operatorname{LP}(v_a) + v_b - \operatorname{LP}(v_b)`}</Eq>
        <p>
          <M>{String.raw`\operatorname{LP}`}</M> is the provided Gaussian low-pass with <M>{String.raw`\sigma = 16`}</M> and a 265 × 265 kernel at
          512 × 512. The first prompt, <M>{String.raw`a`}</M>, controls the coarse layout you see from far away. The second,{' '}
          <M>{String.raw`b`}</M>, supplies the fine detail you see up close. Filtering the velocity rather than the finished image
          means the sampler keeps steering the composition toward <M>{String.raw`a`}</M> at every step while letting <M>{String.raw`b`}</M> paint
          the texture. The distant view is the 64 × 64 Lanczos downsample the notebook displays.
        </p>
        <p className="screen-only reading-hint">
          Drag “viewing distance” to step back from each image. At the far end the slider swaps in the saved 64 × 64
          file.
        </p>
        <div className="hybrid-list">
          <HybridViewer group="skull-waterfall" index="i" name="Skull × waterfall" label="Fig. A29">
            <p>
              The provided example. Up close it is a lovely ink-wash waterfall inside a rounded vignette. From far
              away the skull is faint. The rounded vignette gives a cranium shape and the dark cliff and falls sit
              roughly where the eye sockets and nose would be, but I mostly see it because I know to look.
            </p>
          </HybridViewer>
          <HybridViewer group="cat-forest" index="ii" name="Cat × forest" label="Fig. A30">
            <p>
              Also provided. Up close it is clearly a forest drawn on old paper. From far away the two pale tree
              crowns at the top become ears and the trunks fill in a face. Subtle, but it reads better than the
              skull.
            </p>
          </HybridViewer>
          <HybridViewer group="hourglass-beach" index="iii" name="Hourglass × ocean waves and sand" label="Fig. A31">
            <p>
              My own pair. Up close it is a column of breaking waves between two dark posts, with sand dunes at
              the bottom. From far away the waves disappear and what remains is the frame of an hourglass: dark
              posts, a bright center and a mound of sand. It is more an hourglass frame than a glass bulb, but I
              like that the sand from both prompts became the same dunes.
            </p>
          </HybridViewer>
          <HybridViewer group="butterfly-glass" index="iv" name="Butterfly × stained glass" label="Fig. A32">
            <p>
              The one that worked best. Up close it is three Gothic windows with colored glass and lead lines. From
              far away the two large windows become wings and the small middle window becomes the body. It is
              clearly a symmetric butterfly.
            </p>
          </HybridViewer>
        </div>

        <SubHead>Human face × clockwork, twice</SubHead>
        <div className="clockwork">
          <span className="clockwork__glass">
            <Lancet />
          </span>
          <HybridViewer group="face-clockwork" index="v" name="Face × clockwork, first run" label="Fig. A33" compact>
            <p>
              From far away it is clearly a face. Up close it is still clearly a face. The gears are there, around
              the edge of the head and stacked at the neck, but they frame the face instead of covering it.
            </p>
          </HybridViewer>
          <HybridViewer group="face-clockwork-revised" index="vi" name="Face × clockwork, revised prompts" label="Fig. A34" compact>
            <p>
              The revised run replaced both prompts. Up close it is now nothing but gears. From far away I still
              cannot find a face.
            </p>
          </HybridViewer>
        </div>
        <p>
          I tried making the clockwork prompt more specific because I could still see the human face too clearly at
          full resolution. The gears were there, but they were not nearly as prominent as I wanted. For the second
          run I asked for “hundreds of interlocking clockwork gears and cogwheels filling the entire frame”, and I
          simplified the face prompt to “simple features, broad smooth shadows” so its low frequencies would be easy
          to hide under texture.
        </p>
        <p>
          It overshot. The gears are everywhere now, and up close they look great, but I cannot find the face at any
          size. Even the 64 × 64 view is a column of gears on white. If I squint, the lone gear on the right and the
          cluster on the left sit roughly where eyes might go, but that is me looking for it. My guess is that
          “filling the entire frame” fights the face directly: it asks for dark structure everywhere, including the
          low frequencies, instead of sitting on top of the face's layout.
        </p>
        <p>
          One caveat: the revised run also used a different seed (190 instead of 182), so I cannot fully separate the
          prompt change from the noise change. To really answer whether more gears helps, I would rerun both prompt
          versions on the same seed. Of the two, the first run is the better hybrid.
        </p>
      </Section>
    </>
  )
}
