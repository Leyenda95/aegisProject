import type { ComponentType } from 'react';
import { cx } from '../../cx.ts';
import type { ArtId } from '../ids.ts';
import AgentArt from './AgentArt.tsx';
import BeyondArt from './BeyondArt.tsx';
import CartArt from './CartArt.tsx';
import CountersArt from './CountersArt.tsx';
import DisclaimerArt from './DisclaimerArt.tsx';
import DisclosureArt from './DisclosureArt.tsx';
import DocsArt from './DocsArt.tsx';
import ExploreArt from './ExploreArt.tsx';
import FlowArt from './FlowArt.tsx';
import IdeaArt from './IdeaArt.tsx';
import MarketArt from './MarketArt.tsx';
import PlayersArt from './PlayersArt.tsx';
import ProblemArt from './ProblemArt.tsx';
import ProofArt from './ProofArt.tsx';
import QrArt from './QrArt.tsx';
import ReadyArt from './ReadyArt.tsx';
import RegistryArt from './RegistryArt.tsx';
import RepoArt from './RepoArt.tsx';
import SealArt from './SealArt.tsx';
import VaultArt from './VaultArt.tsx';
import WalletArt from './WalletArt.tsx';
import styles from './Art.module.css';

const ART: Record<ArtId, ComponentType> = {
  disclaimer: DisclaimerArt,
  problem: ProblemArt,
  idea: IdeaArt,
  players: PlayersArt,
  flow: FlowArt,
  ready: ReadyArt,
  beyond: BeyondArt,
  repo: RepoArt,
  docs: DocsArt,
  wallet: WalletArt,
  registry: RegistryArt,
  counters: CountersArt,
  vault: VaultArt,
  cart: CartArt,
  seal: SealArt,
  qr: QrArt,
  disclosure: DisclosureArt,
  proof: ProofArt,
  market: MarketArt,
  agent: AgentArt,
  explore: ExploreArt,
};

/** Una ilustración del recorrido en su marco con fondo de degradado. */
export default function Art({ id, className }: { id: ArtId; className?: string }) {
  const Drawing = ART[id];
  return (
    <div className={cx(styles.frame, className)}>
      <Drawing />
    </div>
  );
}
