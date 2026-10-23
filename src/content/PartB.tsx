import { fig } from '../data/figures'
import { Figure, FigureRow } from '../components/Figure'
import { Eq, M } from '../components/Math'
import { Callout, MarginPlate, Note, Params, Section, SubHead } from '../components/Layout'
import { FrameScrubber, WipeCompare } from '../components/Interactive'
import { UNetDiagram } from '../components/UNetDiagram'

function LossTable({ caption, rows }: { caption: string; rows: Array<[string, ...string[]]> }) {
  const [head, ...body] = rows
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row) => (
            <tr key={row[0]}>
              {row.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PartB() {
  return (
    <>
      {/* ------------------------------------------------------------ B 1.1 */}
      <Section id="b-1-1" num="1.1" title="Implementing the UNet">
        <p>
          The denoiser is a small UNet for 28 × 28 MNIST digits. It is built from a handful of simple operations,
          each one a convolution followed by BatchNorm and GELU:
        </p>
        <ul className="op-list">
          <li>
            <strong>Conv</strong>: 3 × 3, stride 1, padding 1. Changes channels, keeps resolution.
          </li>
          <li>
            <strong>DownConv</strong>: 3 × 3, stride 2, padding 1. Halves the resolution.
          </li>
          <li>
            <strong>UpConv</strong>: 4 × 4 transposed conv, stride 2, padding 1. Doubles the resolution.
          </li>
          <li>
            <strong>Flatten</strong>: 7 × 7 average pool and GELU, taking 7 × 7 down to 1 × 1.
          </li>
          <li>
            <strong>Unflatten</strong>: 7 × 7 transposed conv with stride 7, taking 1 × 1 back to 7 × 7.
          </li>
        </ul>
        <p>
          The composed blocks just add depth: a <strong>ConvBlock</strong> is two Convs, a <strong>DownBlock</strong>{' '}
          is a DownConv then a ConvBlock, and an <strong>UpBlock</strong> is an UpConv then a ConvBlock. The encoder
          goes 28 → 14 → 7 → 1, the decoder comes back up, and at each resolution the decoder concatenates the
          matching encoder features along the channel axis. Those skip connections are why the first UpBlock takes
          4D channels and the second takes 2D. A final 3 × 3 convolution maps D channels back to one.
        </p>
        <figure className="fig fig--wide diagram">
          <div className="diagram__frame">
            <UNetDiagram />
          </div>
          <figcaption className="caption">
            <span className="caption__label">Fig. B1</span>
            <span className="caption__text">
              The unconditional UNet as implemented in my notebook, with tensor shapes for a batch of one.
            </span>
            <span className="caption__meta">original diagram drawn for this page, after the course's Figure 1</span>
          </figcaption>
        </figure>
        <p>
          With <M>{String.raw`D = 128`}</M> the model has 7,891,073 parameters. My first sanity check passed a random
          (4, 1, 28, 28) batch through it and confirmed the output had the same shape and only finite values.
        </p>
      </Section>

      {/* ------------------------------------------------------------ B 1.2 */}
      <Section id="b-1-2" num="1.2" title="Using the UNet to Train a Denoiser">
        <p>The goal is a one-step denoiser trained with an L2 loss on pairs of noisy and clean digits:</p>
        <Eq tag="B.1, B.2">{String.raw`\mathcal{L} = \mathbb{E}_{z,x}\,\big\lVert D_\theta(z) - x \big\rVert^2, \qquad z = x + \sigma\epsilon, \quad \epsilon \sim \mathcal{N}(0, I)`}</Eq>
        <p>
          To see what different noise levels look like, I took the first training digit (a 5), drew one noise
          sample with seed 180, and added it at each <M>{String.raw`\sigma`}</M>. Values are clamped to <M>{String.raw`[0, 1]`}</M> only for
          display.
        </p>
        <Figure
          entry={fig('b-noising-sigmas')}
          size="wide"
          label="Fig. B2"
          caption="The noising process z = x + σε for σ = 0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0."
        />
        <p>
          At <M>{String.raw`\sigma = 0.5`}</M>, the level I train on, the 5 is readable but the background is full of bright
          speckles. By <M>{String.raw`\sigma = 1.0`}</M> I can barely find it.
        </p>

        <SubHead id="b-1-2-1" num="1.2.1">
          Training
        </SubHead>
        <Params
          items={[
            ['σ', '0.5'],
            ['D', '128'],
            ['batch', '256'],
            ['optimizer', 'Adam, lr 1e-4'],
            ['epochs', '5 (235 batches each)'],
          ]}
        />
        <p>
          I noise each batch as it comes out of the shuffled training loader, so every epoch sees fresh{' '}
          <M>{String.raw`\epsilon`}</M>. The loss is MSE between the network output and the clean digit. To compare epochs
          fairly, I fixed ten test digits and one noise sample and reused them after epochs 1 and 5.
        </p>
        <Figure
          entry={fig('b-denoiser-loss')}
          size="wide"
          label="Fig. B3"
          caption="Training loss for the σ = 0.5 denoiser, every optimizer step (light) with a 100-step moving average."
        />
        <LossTable
          caption="Average training loss per epoch, from the notebook log"
          rows={[
            ['epoch', '1', '2', '3', '4', '5'],
            ['MSE', '0.0207', '0.0112', '0.0095', '0.0087', '0.0082'],
          ]}
        />
        <FigureRow
          label="Fig. B4"
          columns={2}
          size="wide"
          className="figrow--stack"
          items={[
            { entry: fig('b-denoiser-epoch1'), label: 'after epoch 1' },
            { entry: fig('b-denoiser-epoch5'), label: 'after epoch 5' },
          ]}
          caption="Rows: noisy test input (σ = 0.5), denoised output, clean original."
          meta="model output · denoiser_epoch_1.png, denoiser_epoch_5.png"
        />
        <p>
          After one epoch the outputs are already clearly digits but soft, with faint smudges around them, and the
          1 in the third column picked up a ghost of a crossbar. After five epochs the strokes are crisper and the
          backgrounds are clean. The 5 in the ninth column still comes out with a filled-in lower loop, though the
          original 5 has an unusually tight loop that is hard to see under the noise.
        </p>

        <SubHead id="b-1-2-2" num="1.2.2">
          Out-of-distribution testing
        </SubHead>
        <p>
          The denoiser only ever saw <M>{String.raw`\sigma = 0.5`}</M>. I kept one test digit (a 7) and one noise sample and varied
          <M>{String.raw`\sigma`}</M>.
        </p>
        <Figure
          entry={fig('b-ood-sigmas')}
          size="wide"
          label="Fig. B5"
          caption="Rows: original, noisy input, denoised output. Same digit and same noise in every column."
        />
        <LossTable
          caption="MSE between the denoised output and the clean digit"
          rows={[
            ['σ', '0.0', '0.2', '0.4', '0.5', '0.6', '0.8', '1.0'],
            ['MSE', '0.00212', '0.00301', '0.00480', '0.00582', '0.00683', '0.00983', '0.02165'],
          ]}
        />
        <p>
          Up to the training level it works well. Even <M>{String.raw`\sigma = 0`}</M> is not perfect: the network slightly blurs
          a clean input, since it never saw one. Above the training level it degrades. At <M>{String.raw`\sigma = 0.8`}</M>
          artifacts creep in and the bottom of the stem bends. At <M>{String.raw`\sigma = 1.0`}</M> the network invents an extra
          horizontal stroke, so the 7 starts to look like a crossed 7 or a Z, and gray specks appear in the
          background. The error more than doubles between 0.8 and 1.0.
        </p>

        <SubHead id="b-1-2-3" num="1.2.3">
          Denoising pure noise
        </SubHead>
        <p>
          Next I trained a fresh UNet with the same settings, except the input is pure Gaussian noise{' '}
          <M>{String.raw`z = \epsilon`}</M> with no digit in it at all, and the target is still a clean training digit.
        </p>
        <Figure
          entry={fig('b-pure-noise-loss')}
          size="wide"
          label="Fig. B6"
          caption="Training loss with pure-noise inputs."
        />
        <LossTable
          caption="Average training loss per epoch"
          rows={[
            ['epoch', '1', '2', '3', '4', '5'],
            ['MSE', '0.0782', '0.0676', '0.0675', '0.0674', '0.0674'],
          ]}
        />
        <FigureRow
          label="Fig. B7"
          columns={2}
          size="wide"
          className="figrow--stack"
          items={[
            { entry: fig('b-pure-noise-epoch1'), label: 'after epoch 1' },
            { entry: fig('b-pure-noise-epoch5'), label: 'after epoch 5' },
          ]}
          caption="Top row: ten fixed noise inputs. Bottom row: what the network outputs for each."
          meta="model output · pure_noise_epoch_1.png, pure_noise_epoch_5.png"
        />
        <p>
          All ten outputs are the same blurry blob, after epoch 1 and after epoch 5, even though the ten inputs are
          completely different. The blob looks like several digits stacked on top of each other: a 0 or 8 outline
          with something like a 3 or 9 inside.
        </p>
        <p>
          That is exactly what MSE asks for here. The input carries no information about which digit is the target,
          so the best a network can do is output the one image that minimizes the expected squared distance to all
          training digits: their pixel-wise mean, the centroid of the dataset. The loss curve agrees. It falls during
          the first hundred or so steps while the network learns to ignore its input, then sits at about 0.067 for
          the rest of training, because there is nothing more to learn.
        </p>
        <Note>a one-step regressor can only give you the average digit</Note>
      </Section>

      {/* ------------------------------------------------------------ B 2.1 */}
      <Section id="b-2-1" num="2.1" title="Adding Time Conditioning to the UNet">
        <p>
          Flow matching fixes the averaging problem by never asking for the whole jump at once. A sample travels
          from noise <M>{String.raw`x_0`}</M> to data <M>{String.raw`x_1`}</M> along
        </p>
        <MarginPlate
          src="images/decorative/haeckel-muscinae-moss.webp"
          w={560}
          h={669}
          caption="Haeckel, Muscinae, 1904"
        />
        <Eq tag="B.3, B.4, B.5">{String.raw`x_t = (1 - t)\,x_0 + t\,x_1, \qquad u(x_t, t) = \frac{d x_t}{dt} = x_1 - x_0, \qquad \mathcal{L} = \mathbb{E}\,\big\lVert (x_1 - x_0) - u_\theta(x_t, t) \big\rVert^2`}</Eq>
        <p>
          One network has to handle every point on that path, and the right velocity depends on how far along we
          are. Near <M>{String.raw`t = 0`}</M> the input is nearly pure noise and the velocity is mostly “decide on a digit”. Near{' '}
          <M>{String.raw`t = 1`}</M> it is “clean up a few pixels”. Without <M>{String.raw`t`}</M> the network would have to guess the noise level
          from the image itself, so I pass it in.
        </p>
        <p>
          In my <code>TimeConditionalUNet</code>, <M>{String.raw`t`}</M> arrives as a vector of shape (N,), already normalized to{' '}
          <M>{String.raw`[0, 1]`}</M>, and is reshaped to (N, 1). Two FCBlocks embed it. An FCBlock is Linear, GELU, Linear.
        </p>
        <ul className="op-list">
          <li>
            <code>fc1_t = FCBlock(1, 2D)</code> gives <M>{String.raw`t_1`}</M>, which multiplies the Unflatten output (2D × 7 × 7).
          </li>
          <li>
            <code>fc2_t = FCBlock(1, D)</code> gives <M>{String.raw`t_2`}</M>, which multiplies the first UpBlock output (D × 14 × 14).
          </li>
        </ul>
        <p>
          Both embeddings are reshaped to (N, C, 1, 1) and broadcast over height and width, so time acts as a
          per-channel gain on the decoder features. Everything else is the same UNet. With <M>{String.raw`D = 64`}</M> the model
          has 1,996,417 parameters. A sanity test with two different times, <M>{String.raw`t = 0.25`}</M> and <M>{String.raw`0.75`}</M>, checked
          the output shape and confirmed gradients reach both FCBlocks.
        </p>
        <figure className="fig fig--wide diagram">
          <div className="diagram__frame">
            <UNetDiagram conditioned />
          </div>
          <figcaption className="caption">
            <span className="caption__label">Fig. B8</span>
            <span className="caption__text">
              Where conditioning enters: the Unflatten output and the first UpBlock output are modulated by the
              time (and later class) embeddings.
            </span>
            <span className="caption__meta">original diagram drawn for this page, after the course's Figure 4</span>
          </figcaption>
        </figure>
      </Section>

      {/* ------------------------------------------------------------ B 2.2 */}
      <Section id="b-2-2" num="2.2" title="Training the UNet">
        <p>
          Each training step samples a batch of clean digits <M>{String.raw`x_1`}</M>, fresh noise <M>{String.raw`x_0`}</M>, and an independent{' '}
          <M>{String.raw`t \sim U[0, 1]`}</M> per image, builds <M>{String.raw`x_t`}</M>, and regresses the UNet's output onto{' '}
          <M>{String.raw`x_1 - x_0`}</M> with MSE. That is all of <code>time_fm_forward</code>.
        </p>
        <Params
          items={[
            ['D', '64'],
            ['batch', '64 (938 per epoch)'],
            ['optimizer', 'Adam, lr 1e-2'],
            ['schedule', 'ExponentialLR, γ = 0.1^(1/10), stepped each epoch'],
            ['epochs', '10 (9,380 steps)'],
          ]}
        />
        <Figure
          entry={fig('b-time-fm-loss')}
          size="wide"
          label="Fig. B9"
          caption="Training loss for the time-conditioned UNet over the whole run."
        />
        <LossTable
          caption="Average training loss per epoch and the learning rate used during that epoch"
          rows={[
            ['epoch', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            ['MSE', '0.1668', '0.1204', '0.1092', '0.1031', '0.0996', '0.0972', '0.0953', '0.0950', '0.0933', '0.0921'],
            ['lr', '1.0e-2', '7.9e-3', '6.3e-3', '5.0e-3', '4.0e-3', '3.2e-3', '2.5e-3', '2.0e-3', '1.6e-3', '1.3e-3'],
          ]}
        />
        <p>
          The loss drops sharply in the first few hundred steps and then creeps down for the rest of training. It
          settles far above the denoiser's loss, which is expected: near <M>{String.raw`t = 0`}</M> many different digits are
          consistent with the same noise, so part of the target is unpredictable no matter how good the network is.
        </p>
      </Section>

      {/* ------------------------------------------------------------ B 2.3 */}
      <Section id="b-2-3" num="2.3" title="Sampling from the UNet">
        <p>
          Sampling integrates the learned velocity from noise to data with 50 Euler steps. Starting from{' '}
          <M>{String.raw`x \sim \mathcal{N}(0, I)`}</M> with seed 180, for <M>{String.raw`i = 0, \dots, 49`}</M>:
        </p>
        <Eq>{String.raw`t_i = \tfrac{i}{50}, \qquad x \leftarrow x + \tfrac{1}{50}\,u_\theta(x, t_i)`}</Eq>
        <FrameScrubber
          label="Fig. B10"
          mode="tabs"
          interval={1300}
          frames={[
            { entry: fig('b-time-fm-epoch1'), label: 'epoch 1' },
            { entry: fig('b-time-fm-epoch5'), label: 'epoch 5' },
            { entry: fig('b-time-fm-epoch10'), label: 'epoch 10' },
          ]}
          caption="Ten samples from the time-conditioned model, saved during training at epochs 1, 5 and 10."
          meta="model output · time_fm_epoch_1.png, time_fm_epoch_5.png, time_fm_epoch_10.png"
        />
        <Figure
          entry={fig('b-time-fm-epochs-1-5-10')}
          size="wide"
          label="Fig. B11"
          caption="The same three checkpoints reloaded and sampled from the same noise, one row per epoch."
        />
        <p>
          Because the starting noise is fixed, each column is the same trajectory evolving as training improves.
          Epoch 1 is scribbles with digit-like strokes; I can maybe find a 5 and a 2. Epoch 5 has a recognizable 7,
          3 and 2, and the rest look more like letters. By epoch 10 most columns read as digits: 8, 7, 5, 8, 9, 2,
          3. The first and fourth columns are still blobs somewhere between a 6 and something else.
        </p>
        <p>
          The layout of each column is mostly decided early, between epochs 1 and 5, and later training mainly
          sharpens it. The results are legible but clearly worse than the class-conditioned model below.
        </p>
        <Note>same noise every time, the digits just get sharper</Note>
      </Section>

      {/* ------------------------------------------------------------ B 2.4 */}
      <Section id="b-2-4" num="2.4" title="Adding Class Conditioning to the UNet">
        <p>
          For more control I also condition on the digit class. My <code>ClassConditionalUNet</code> converts the
          label to a 10-dimensional one-hot vector inside <code>forward</code> with <code>F.one_hot</code> and embeds
          it with two more FCBlocks, <code>fc1_c</code> (10 → 2D) and <code>fc2_c</code> (10 → D). The class scales
          the features and time shifts them:
        </p>
        <Eq>{String.raw`\text{unflatten} \leftarrow c_1 \odot \text{unflatten} + t_1, \qquad \text{up}_1 \leftarrow c_2 \odot \text{up}_1 + t_2`}</Eq>
        <p>
          To keep an unconditional mode for classifier-free guidance, the class is dropped 10% of the time during
          training. In <code>class_fm_forward</code> I draw <code>mask = rand(N) ≥ p_uncond</code> with{' '}
          <M>{String.raw`p_{\text{uncond}} = 0.1`}</M>, and the model multiplies the one-hot vector by the mask, so a dropped example
          sees an all-zero class vector. One detail I noticed: <code>fc1_c</code> of a zero vector is not zero,
          because of the biases. So “no class” is really a learned constant embedding rather than switching the
          modulation off.
        </p>
        <p>At sampling time, the unconditional prediction passes an all-zero mask, and the two are combined with</p>
        <Eq>{String.raw`u = u_u + \gamma\,(u_c - u_u), \qquad \gamma = 5`}</Eq>
        <p>
          This is written differently from Part A's <M>{String.raw`v_c + w(v_c - v_u)`}</M>, but it is the same family:
          rearranging gives <M>{String.raw`\gamma = w + 1`}</M>. So <M>{String.raw`\gamma = 5`}</M> here is a bit gentler than Part A's{' '}
          <M>{String.raw`w = 7`}</M>, which corresponds to <M>{String.raw`\gamma = 8`}</M>.
        </p>
      </Section>

      {/* ------------------------------------------------------------ B 2.5 */}
      <Section id="b-2-5" num="2.5" title="Training the UNet">
        <p>
          Training is the same as the time-only model plus labels: each batch provides digits and their classes,
          and the class is randomly dropped as described above. I seeded the run with 180 so the no-scheduler
          comparison later starts from the same weights and data order.
        </p>
        <Params
          items={[
            ['D', '64'],
            ['batch', '64'],
            ['optimizer', 'Adam, lr 1e-2'],
            ['schedule', 'ExponentialLR, γ = 0.1^(1/10)'],
            ['p_uncond', '0.1'],
            ['epochs', '10 (9,380 steps)'],
          ]}
        />
        <Figure
          entry={fig('b-class-fm-loss-scheduled')}
          size="wide"
          label="Fig. B12"
          caption="Training loss for the class-conditioned UNet (exponential learning rate schedule)."
          extra="recovered from the saved notebook output"
        />
        <LossTable
          caption="Average training loss per epoch, class-conditioned with the scheduler"
          rows={[
            ['epoch', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            ['MSE', '0.1698', '0.1163', '0.1045', '0.0966', '0.0929', '0.0903', '0.0881', '0.0869', '0.0856', '0.0847'],
          ]}
        />
        <p>
          The curve looks much like the time-only one except for a tall spike on the very first steps. It ends lower,
          0.0847 at epoch 10 against 0.0921 for the time-only model. Knowing the class removes a lot of the ambiguity
          near <M>{String.raw`t = 0`}</M>: the network no longer has to decide which digit a patch of noise is heading toward.
        </p>
      </Section>

      {/* ------------------------------------------------------------ B 2.6 */}
      <Section id="b-2-6" num="2.6" title="Sampling from the Class-Conditioned UNet">
        <p>
          For each checkpoint I generated four samples of every digit (40 images, labels 0 to 9 repeated four times)
          with 300 Euler steps, <M>{String.raw`\gamma = 5`}</M>, and the same seed, 180.
        </p>
        <FrameScrubber
          label="Fig. B13"
          mode="tabs"
          interval={1300}
          frames={[
            { entry: fig('b-class-fm-epoch1'), label: 'epoch 1' },
            { entry: fig('b-class-fm-epoch5'), label: 'epoch 5' },
            { entry: fig('b-class-fm-epoch10'), label: 'epoch 10' },
          ]}
          caption="Class-conditioned samples with CFG (γ = 5). Columns are digits 0 to 9; rows are four samples each."
          meta="model output · class_fm_scheduled_epoch_{1,5,10}_samples.png"
        />
        <p>
          Even after one epoch every column is the right digit, which is the class conditioning doing its job. The
          strokes are thick and noisy and some of the 5s and 8s fall apart. By epoch 5 nearly every sample is clean,
          and epoch 10 is a bit sharper again, with more variety in slant and stroke width. A few failures remain:
          one 5 in the fourth row is a squashed scribble.
        </p>

        <SubHead id="b-2-6-scheduler">Removing the learning rate scheduler</SubHead>
        <p>
          The last question is whether the exponential scheduler is necessary. My no-scheduler run,{' '}
          <code>class_fm_no_scheduler</code>, goes through the same <code>train_class_model</code> function, so
          architecture, seed, data order, batch size, <M>{String.raw`p_{\text{uncond}}`}</M>, epoch count and sampling settings are
          identical. The only changes are <code>use_scheduler=False</code> and the learning rate.
        </p>
        <p>
          To compensate for losing the decay, I lowered the learning rate to a constant <strong>2e-3</strong> instead
          of starting at 1e-2. Holding 1e-2 for all ten epochs would keep the most aggressive part of the schedule
          the whole time. 2e-3 is about where the scheduled run is by epoch 8, slow enough to settle at the end,
          while still being large enough to make progress early.
        </p>
        <Figure
          entry={fig('b-scheduler-loss-comparison')}
          size="wide"
          label="Fig. B14"
          caption="Average training loss per epoch for the two runs (the x-axis is 0-indexed)."
        />
        <Figure
          entry={fig('b-class-fm-loss-constant')}
          size="wide"
          label="Fig. B15"
          caption="Full training loss for the constant learning rate run."
          extra="recovered from the saved notebook output"
        />
        <LossTable
          caption="Average training loss per epoch, both runs"
          rows={[
            ['epoch', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            ['scheduled', '0.1698', '0.1163', '0.1045', '0.0966', '0.0929', '0.0903', '0.0881', '0.0869', '0.0856', '0.0847'],
            ['constant 2e-3', '0.1426', '0.1078', '0.1003', '0.0952', '0.0928', '0.0914', '0.0890', '0.0880', '0.0867', '0.0863'],
          ]}
        />
        <p>
          The constant run actually starts faster: 0.1426 against 0.1698 after the first epoch, since 1e-2 is a big
          step size for a freshly initialized network. The curves cross between epochs 5 and 6, and from then on the
          decaying rate is slightly ahead, finishing at 0.0847 against 0.0863.
        </p>
        <FigureRow
          label="Fig. B16"
          columns={2}
          size="wide"
          items={[
            { entry: fig('b-class-fm-epoch10'), label: 'scheduled, epoch 10' },
            { entry: fig('b-class-fm-noscheduler-epoch10'), label: 'constant 2e-3, epoch 10' },
          ]}
          caption="Epoch-10 samples from both runs with the same seed and guidance."
          meta="model output · class_fm_scheduled_epoch_10_samples.png, class_fm_no_scheduler_epoch_10_samples.png"
        />
        <Figure
          entry={fig('b-scheduler-visual-comparison')}
          size="text"
          label="Fig. B17"
          caption="The notebook's stacked comparison: scheduled run in the top four rows, constant learning rate in the bottom four."
        />
        <p>
          Visually the two are very close. Both produce a clean, correct digit in every cell. The scheduled run has
          the squashed 5; the constant run has a couple of 8s with a stray hook on top. I would call the samples a
          tie, with a small loss advantage for the scheduler. For this problem a sensibly chosen constant rate gets
          nearly all of the way there.
        </p>
        <WipeCompare
          pairs={[{ key: '10', before: fig('b-class-fm-epoch10'), after: fig('b-class-fm-noscheduler-epoch10') }]}
          beforeLabel="scheduled"
          afterLabel="constant 2e-3"
          aspect="1440 / 552"
          maxWidth="48rem"
          caption="Drag across the two epoch-10 grids: same seed and guidance, scheduled run on the left, constant learning rate on the right."
          meta="model output · class_fm_scheduled_epoch_10_samples.png vs class_fm_no_scheduler_epoch_10_samples.png"
        />
        <Note>honestly, a tie</Note>
        <Callout title="What I did not run">
          <p>
            I only sampled the no-scheduler model at epoch 10. Its epoch 1 and 5 checkpoints were saved but not
            sampled, so I cannot compare how fast the two runs became legible.
          </p>
        </Callout>
      </Section>
    </>
  )
}
