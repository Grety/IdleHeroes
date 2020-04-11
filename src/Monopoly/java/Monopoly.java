import java.util.Random;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Set;

public class MyClass {
    static Random random = new Random();
    static final int FREE_DICES = 78;

    public static void main(String args[]) {
        HashMap<String, Long> avResults = new HashMap<String, Long>();
        HashMap<String, Long> minResults = new HashMap<String, Long>();
        HashMap<String, Long> maxResults = new HashMap<String, Long>();
        MonopolyEngine engine = new MonopolyEngine();
        int N = 100000;
        byte verbose = 0; // Flags: 1 - results of each run, 2 - steps of each run
        for (int i = 0; i < N; i++) {
            engine.Play(FREE_DICES, new ReplicateDiceStrategy(), verbose);
            // engine.Play(FREE_DICES, new ReplicateDiceWhenFarEnoughStrategy(), verbose);
            // engine.Play(FREE_DICES, new UseLuckyDiceAtOnceStrategy(), verbose);

            ForAllMapElements(avResults, engine.resources, (a, b) -> a == null ? b : a + b); // sum
            ForAllMapElements(minResults, engine.resources, (a, b) -> (a == null || a > b) ? b : a); // min
            ForAllMapElements(maxResults, engine.resources, (a, b) -> (a == null || a < b) ? b : a); // max
        }

        for (Map.Entry<String, Long> entry : avResults.entrySet())
            avResults.put(entry.getKey(), entry.getValue() / N);
        PrintMap(avResults, "\nAverage resources:", Set.of("Stars"));
        PrintMap(minResults, "\nMin resources:", Set.of("Stars"));
        PrintMap(maxResults, "\nMax resources:", Set.of("Stars"));
    }

    public static class Tile {
        String name;

        public Tile(String rewardName) {
            name = rewardName;
        }

        public int getReward() { return 1; }
        public void Upgrade() { }
        public void Downgrade() { }
        public Effect getEffect() { return Effect.NONE; }
    }

    public static class RewardTile extends Tile {
        int[] amounts;
        int level = 0;

        public RewardTile(String rewardName, int[] rewardAmounts) {
            super(rewardName);
            amounts = rewardAmounts;
        }

        public int getReward() {
            return this.amounts[this.level];
        }

        public void Upgrade() {
            if (this.level < this.amounts.length - 1)
                this.level += 1;
        }

        public void Downgrade() {
            if (this.level > 0)
                this.level -= 1;
        }
    }

    public static class KarmaTile extends Tile {
        public KarmaTile() {
            super("Karma");
        }

        public Effect getEffect() {
            return Effect.KARMA;
        }
    }

    public static class TarotTile extends Tile {
        public TarotTile() {
            super("Tarot Hut");
        }

        public Effect getEffect() {
            int effectIdx = random.nextInt(9) + 2;

            return Effect.values()[effectIdx];
        }
    }

    public static class MonopolyEngine {
        Tile[] field;
        int position;
        long luckyDiceCount;
        long normalDiceCount;
        Effect effect;

        HashMap<String, Long> resources;

        public MonopolyEngine() {

            field = new Tile[]{
      			new RewardTile("Spirit", new int[] { 650000, 1300000, 2000000 }),
    			new RewardTile("Promotion Stones", new int[] { 500, 1000, 1500 }),
    			new RewardTile("Magic Dust", new int[] { 500, 1000, 1500 }),
    			new RewardTile("Stars", new int[] { 3, 4, 5 }),
    			new Tile("Dice"),
    			new RewardTile("3-star shards", new int[] { 20, 40, 60 }),
    			new RewardTile("Spirit", new int[] { 650000, 1300000, 2000000 }),
    			new RewardTile("Monster Souls", new int[] { 500, 1000, 1500 }),
    			new RewardTile("Magic Dust", new int[] { 500, 100, 1500 }),
    			new TarotTile(),
    			new RewardTile("Stars", new int[] { 3, 4, 5 }),
    			new RewardTile("Promotion Stones", new int[] { 500, 1000, 1500 }),
    			new RewardTile("5-star shards", new int[] { 10, 20, 30 }),
    			new RewardTile("Spirit", new int[] { 650000, 1300000, 2000000 }),
    			new KarmaTile(),
    			new RewardTile("Magic Dust", new int[] { 500, 1000, 1500 }),
    			new RewardTile("4-star shards", new int[] { 10, 20, 30 }),
    			new RewardTile("Stars", new int[] { 3, 4, 5 }),
    			new RewardTile("Chaos Stones", new int[] { 100, 200, 300 }),
    			new Tile("Lucky Dice")
            };
            this.Reset();
        }

        public void Reset() {
            this.effect = Effect.NONE;
            this.position = -1;
            this.resources = new HashMap<String, Long>();
            for (Tile tile : this.field)
                this.resources.put(tile.name, 0L);
        }

        public void Play(long diceCount, IStrategy strategy, byte verbose) {
            if (verbose != 0)
                System.out.println(String.format("\nGambling with %d dices on hands", diceCount));
            this.Reset();
            this.resources.put("Dice", diceCount);
            // this.resources.put("Lucky Dice", 4L);
            while (this.Move(strategy, (verbose & 2) == 2));
            if ((verbose & 1) == 1)
                this.PrintResources();
        }

        public void PrintResources() {
            PrintMap(this.resources, null, null);
        }

        public void AddReward(Tile tile)  {
            this.resources.put(tile.name, this.resources.get(tile.name) + tile.getReward());
        }

        public static int RollDice() {
            return random.nextInt(6) + 1;
        }

        public boolean Move(IStrategy strategy, boolean verbose) {
            long dicesLeft = this.resources.get("Dice");
            long luckyDicesLeft = this.resources.get("Lucky Dice");
            boolean useLuckyDice = luckyDicesLeft != 0 && strategy.useLucky(dicesLeft, luckyDicesLeft, this.position, this.field, this.effect);
            int nextStep = useLuckyDice ?
                strategy.rollLucky(dicesLeft, luckyDicesLeft, this.position, this.field, this.effect) :
                this.RollDice();

            if (this.effect == Effect.COPYCAT || this.effect == Effect.DOUBLE_ROLL)
                nextStep *= 2;

            if ((this.effect == Effect.KARMA && (nextStep % 2 == 1)) || (this.effect == Effect.MOVE_BACK)) {
                this.position = (this.position - nextStep) % this.field.length; // step back without collecting or upgrading
            }
            else {

                // collect Stars when passing Mushrooms
                for (int pointer = this.position + 1; pointer < this.position + nextStep - 1; pointer++) {
                    Tile passing = this.field[pointer % this.field.length];
                    if (passing.name == "Stars")
                        this.AddReward(passing);
                }
                this.position = (this.position + nextStep) % this.field.length;
            }

            Tile landedOn = this.field[this.position];

            if (this.effect != Effect.EAT_RESOURCES)
                this.AddReward(landedOn);

            if (nextStep > 0) //don't upgrade on moving back
                landedOn.Upgrade();

            this.effect = landedOn.getEffect();

            // immediate effects
            if (this.effect == Effect.UPGRADE) this.UpgradeRandomReward();
            if (this.effect == Effect.DOWNGRADE) this.DowngradeRandomReward();
            if (this.effect == Effect.RESET_POS) this.position = -1;

            // consume dice used for the move
            dicesLeft = this.resources.get("Dice");
            luckyDicesLeft = this.resources.get("Lucky Dice");
            if (useLuckyDice)
                this.resources.put("Lucky Dice", --luckyDicesLeft);
            else
                this.resources.put("Dice", --dicesLeft);

            if (verbose)
                System.out.println(String.format("Tile[%02d]: %-17s\tusedLucky: %b;\tstepped: %d;\tDices: %d, %d;\tEffect: %s;\tStars: %s",
                    this.position, landedOn.name, useLuckyDice, nextStep, dicesLeft, luckyDicesLeft, this.effect, this.resources.get("Stars")));

            return luckyDicesLeft > 0 || dicesLeft > 0; // report if we can continue to move
        }

        private void UpgradeRandomReward() {
            ArrayList<RewardTile> unupgraded = new ArrayList<>();
            for (Tile tile : this.field) {
                if (!(tile instanceof RewardTile))
                    continue;
                RewardTile rewardTile = (RewardTile)tile;
                if (rewardTile.level < 3)
                    unupgraded.add(rewardTile);
            }
            if (unupgraded.size() == 0)
                return;
            int idx = random.nextInt(unupgraded.size());
            RewardTile tile = unupgraded.get(idx);
            tile.Upgrade();
        }

        private void DowngradeRandomReward() {
            ArrayList<RewardTile> upgraded = new ArrayList<>();
            for (Tile tile : this.field) {
                if (!(tile instanceof RewardTile))
                    continue;
                RewardTile rewardTile = (RewardTile)tile;
                if (rewardTile.level > 1)
                    upgraded.add(rewardTile);
            }
            if (upgraded.size() == 0)
                return;
            int idx = random.nextInt(upgraded.size());
            RewardTile tile = upgraded.get(idx);
            tile.Downgrade();
        }
    }

    public enum Effect { NONE, KARMA, ENERGY, EAT_RESOURCES, DOUBLE_ROLL, MOVE_BACK, DOWNGRADE, DOUBLE_STARS, RESET_POS, COPYCAT, UPGRADE };

    public static class ReplicateDiceWhenFarEnoughStrategy implements IStrategy {
        public boolean useLucky(long dices, long luckyDices, int position, Tile[] field, Effect effect) {
            if (dices == 0)
                return true;

            if (position >= 13 && position < 16 && // if can reach Lucky Dice Hut in one roll
                position != 14) // but is not on Karma Hut
                return true;

            if (luckyDices > 1 && position == 14)
                return true; // save our ass from that Karma

            if (effect == Effect.COPYCAT || effect == Effect.DOUBLE_ROLL) // standing on Tarot and got 2x tiles next roll
                return true;

            if (luckyDices > 1 && (
                this.isInProximityAndCanUpgrade(position, field, 3) ||
                this.isInProximityAndCanUpgrade(position, field, 10) ||
                this.isInProximityAndCanUpgrade(position, field, 17)
                ))
                return true;

            return false;
        }

        private boolean isInProximityAndCanUpgrade(int position, Tile[] field, int tileNo) {
            int distance = ((tileNo - position) % field.length);
            return (distance > 1 && distance <= 6 && ((RewardTile)field[tileNo]).level < 3);
        }

        public int rollLucky(long dices, long luckyDices, int position, Tile[] field, Effect effect) {
            if (dices == 0)
                return 6;

            if (luckyDices > 1 && position == 14)
                return 6; // save our ass from that Karma

            if (effect == Effect.COPYCAT || effect == Effect.DOUBLE_ROLL)
                return 5;

            // upgrade mushrooms if we have abundance of lucky dices
            if (luckyDices > 1 && this.isInProximityAndCanUpgrade(position, field, 3))
                return (3 - position) % field.length;

            if (luckyDices > 1 && this.isInProximityAndCanUpgrade(position, field, 10))
                return (10 - position) % field.length;

            if (luckyDices > 1 && this.isInProximityAndCanUpgrade(position, field, 17))
                return (17 - position) % field.length;

            return 19 - position;
        }
    }
    public static class ReplicateDiceStrategy implements IStrategy {
        public boolean useLucky(long dices, long luckyDices, int position, Tile[] field, Effect effect) {
            if (dices == 0)
                return true;

            if (position >= 13 && position < 19 && // if can reach Lucky Dice Hut in one roll
                position != 14) // but is not on Karma Hut
                return true;

            if (effect == Effect.COPYCAT || effect == Effect.DOUBLE_ROLL) // standing on Tarot and got 2x tiles next roll
                return true;

            return false;
        }
        public int rollLucky(long dices, long luckyDices, int position, Tile[] field, Effect effect) {
            if (dices == 0)
                return 6;

            if (effect == Effect.COPYCAT || effect == Effect.DOUBLE_ROLL)
                return 5;

            return 19 - position;
        }
    }

    public static class UseLuckyDiceAtOnceStrategy implements IStrategy {
        public boolean useLucky(long dices, long luckyDices, int position, Tile[] field, Effect effect) {
                return true;
        }
        public int rollLucky(long dices, long luckyDices, int position, Tile[] field, Effect effect) {
                return 6;
        }
    }

    public interface HashMapPredicate {
        Long exec(Long a, Long b);
    }

    public interface IStrategy {
        boolean useLucky(long dices, long luckyDices, int position, Tile[] field, Effect effect);
        int rollLucky(long dices, long luckyDices, int position, Tile[] field, Effect effect);
    }

    public static void ForAllMapElements(HashMap<String, Long> a, HashMap<String, Long> b, HashMapPredicate predicate) {
        for (Map.Entry<String, Long> entry : b.entrySet()) {
            String key = entry.getKey();
            a.put(key, predicate.exec(a.get(key), entry.getValue()));
        }
    }

    public static double mean(int[] numbers) {
        double sum = 0;
        for (int number : numbers) {
            sum += number;
        }
        return sum/((double)numbers.length);
    }

    public static int max(int[] numbers) {
        int max = numbers[0];
        for (int i = 1; i < numbers.length; i++) {
            if (numbers[i] > max) {
                max = numbers[i];
            }
        }
        return max;
    }

     public static void PrintMap(HashMap<String, Long> map, String title, Set<String> keysOnly) {
        if (title != null)
            System.out.println(title);
        for (Map.Entry<String, Long> entry : map.entrySet())
            if (keysOnly == null || keysOnly.contains(entry.getKey()))
                System.out.println(entry.getKey() + ": " + entry.getValue());
     }
}