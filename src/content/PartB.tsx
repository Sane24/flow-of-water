import { fig } from '../data/figures'
import { Figure, FigureRow } from '../components/Figure'
import { Eq, M } from '../components/Math'
import { MarginPlate, Note, Params, Section, SubHead } from '../components/Layout'
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
          A <strong>ConvBlock</strong> is two Convs, a <strong>DownBlock</strong> is DownConv + ConvBlock, and an{' '}
          <strong>UpBlock</strong> is UpConv + ConvBlock. The encoder goes 28 → 14 → 7 → 1, the decoder comes back
          up, and skip connections concatenate the matching encoder features at each resolution.
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
          With <M>{String.raw`D = 128`}</M> the model has 7,891,073 parameters.
        </p>
      </Section>

      {/* ------------------------------------------------------------ B 1.2 */}
      <Section id="b-1-2" num="1.2" title="Using the UNet to Train a Denoiser">
        <p>The goal is a one-step denoiser trained with an L2 loss on pairs of noisy and clean digits:</p>
        <Eq tag="B.1, B.2">{String.raw`\mathcal{L} = \mathbb{E}_{z,x}\,\big\lVert D_\theta(z) - x \big\rVert^2, \qquad z = x + \sigma\epsilon, \quad \epsilon \sim \mathcal{N}(0, I)`}</Eq>
        <p>
          I took the first training digit (a 5) and added one noise sample (seed 180) at each <M>{String.raw`\sigma`}</M>.
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
          Each batch is noised as it comes out of the loader, so every epoch sees fresh <M>{String.raw`\epsilon`}</M>. I fixed
          ten test digits and one noise sample to compare epochs 1 and 5.
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
          After one epoch the outputs are digits but soft, with faint smudges. After five epochs the strokes are
          crisper and the backgrounds are clean, though the 5 in the ninth column still has a filled-in loop.
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
          Up to the training level it works well. Above it, things degrade: at <M>{String.raw`\sigma = 0.8`}</M> the stem bends,
          and at <M>{String.raw`\sigma = 1.0`}</M> the network adds an extra stroke so the 7 starts to look like a Z. The error
          more than doubles from 0.8 to 1.0.
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
          All ten outputs are the same blurry blob, even though the inputs are completely different. It looks like
          several digits stacked on top of each other.
        </p>
        <p>
          That is what MSE asks for here. The input says nothing about which digit is the target, so the best output
          is the pixel-wise mean of the training digits. The loss drops for the first hundred or so steps while the
          network learns to ignore its input, then flattens at about 0.067.
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
          The right velocity depends on how far along the path we are, so the network gets <M>{String.raw`t`}</M> as an input.
          In my <code>TimeConditionalUNet</code>, <M>{String.raw`t`}</M> (normalized to <M>{String.raw`[0, 1]`}</M>) is embedded by two FCBlocks
          (Linear, GELU, Linear):
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
          Both are broadcast over height and width, so time acts as a per-channel gain on the decoder features. With{' '}
          <M>{String.raw`D = 64`}</M> the model has 1,996,417 parameters.
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
          The starting noise is fixed, so each column shows the same sample improving with training. Epoch 1 is
          scribbles, epoch 5 has a recognizable 7, 3 and 2, and by epoch 10 most columns read as digits, though the
          first and fourth are still blobs. Legible, but clearly worse than the class-conditioned model below.
        </p>
        <Note>same noise every time, the digits just get sharper</Note>
      </Section>

      {/* ------------------------------------------------------------ B 2.4 */}
      <Section id="b-2-4" num="2.4" title="Adding Class Conditioning to the UNet">
        <p>
          My <code>ClassConditionalUNet</code> one-hot encodes the digit label and embeds it with two more FCBlocks,{' '}
          <code>fc1_c</code> (10 → 2D) and <code>fc2_c</code> (10 → D). The class scales the features and time shifts
          them:
        </p>
        <Eq>{String.raw`\text{unflatten} \leftarrow c_1 \odot \text{unflatten} + t_1, \qquad \text{up}_1 \leftarrow c_2 \odot \text{up}_1 + t_2`}</Eq>
        <p>
          To keep an unconditional mode for classifier-free guidance, the class vector is zeroed 10% of the time
          during training. At sampling time the two predictions are combined with
        </p>
        <Eq>{String.raw`u = u_u + \gamma\,(u_c - u_u), \qquad \gamma = 5`}</Eq>
        <p>
          This is Part A's formula with <M>{String.raw`\gamma = w + 1`}</M>, so <M>{String.raw`\gamma = 5`}</M> is a bit gentler than Part A's{' '}
          <M>{String.raw`w = 7`}</M>.
        </p>
      </Section>

      {/* ------------------------------------------------------------ B 2.5 */}
      <Section id="b-2-5" num="2.5" title="Training the UNet">
        <p>
          Same as the time-only model plus labels. I seeded the run with 180 so the no-scheduler run later starts
          from the same weights and data order.
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
          It ends lower than the time-only model (0.0847 vs 0.0921), since knowing the class removes a lot of the
          ambiguity near <M>{String.raw`t = 0`}</M>.
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
          Even after one epoch every column is the right digit, though the strokes are thick and some 5s and 8s fall
          apart. By epoch 5 nearly every sample is clean, and epoch 10 is a bit sharper with more variety. One 5 in
          the fourth row is still a squashed scribble.
        </p>

        <SubHead id="b-2-6-scheduler">Removing the learning rate scheduler</SubHead>
        <p>
          Is the exponential scheduler necessary? My no-scheduler run uses the same <code>train_class_model</code>{' '}
          function, so everything matches except <code>use_scheduler=False</code> and the learning rate. Without the
          decay I used a constant <strong>2e-3</strong> instead of 1e-2, which is about where the scheduled run is by
          epoch 8.
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
          The constant run starts faster (0.1426 vs 0.1698 after epoch 1), the curves cross between epochs 5 and 6,
          and the scheduled run finishes slightly ahead (0.0847 vs 0.0863).
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
          Visually the two are very close: both give a clean, correct digit in every cell. I would call it a tie,
          with a small loss advantage for the scheduler.
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
      </Section>
    </>
  )
}
