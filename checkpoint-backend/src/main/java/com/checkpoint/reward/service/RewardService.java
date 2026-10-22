package com.checkpoint.reward.service;

import com.checkpoint.common.exception.BadRequestException;
import com.checkpoint.common.exception.ConflictException;
import com.checkpoint.common.exception.NotFoundException;
import com.checkpoint.reward.dto.RewardDtos.BoostDto;
import com.checkpoint.reward.dto.RewardDtos.ChestDto;
import com.checkpoint.reward.dto.RewardDtos.ItemDto;
import com.checkpoint.reward.dto.RewardDtos.OpenChestResponse;
import com.checkpoint.reward.dto.RewardDtos.RewardsResponse;
import com.checkpoint.reward.dto.SessionRewards;
import com.checkpoint.reward.entity.BoostType;
import com.checkpoint.reward.entity.ChestSource;
import com.checkpoint.reward.entity.ChestTier;
import com.checkpoint.reward.entity.RewardItem;
import com.checkpoint.reward.entity.RewardKind;
import com.checkpoint.reward.entity.RewardLoadout;
import com.checkpoint.reward.entity.RewardOdds;
import com.checkpoint.reward.entity.UserBoost;
import com.checkpoint.reward.entity.UserChest;
import com.checkpoint.reward.entity.UserItem;
import com.checkpoint.reward.repository.RewardItemRepository;
import com.checkpoint.reward.repository.RewardLoadoutRepository;
import com.checkpoint.reward.repository.RewardOddsRepository;
import com.checkpoint.reward.repository.StreakMilestoneRepository;
import com.checkpoint.reward.repository.UserBoostRepository;
import com.checkpoint.reward.repository.UserChestRepository;
import com.checkpoint.reward.repository.UserItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/** Chests, boosts and the student's collection. All rolls happen here, on the server. */
@Service
public class RewardService {

    static final int MIN_ANSWERED_FOR_CHEST = 10;
    static final int MAX_BOOST_BONUS = 10;
    static final int MAX_STICKERS = 3;
    static final String DEFAULT_SKIN = "sprout";

    private final RewardItemRepository itemRepository;
    private final RewardOddsRepository oddsRepository;
    private final StreakMilestoneRepository milestoneRepository;
    private final UserChestRepository chestRepository;
    private final UserItemRepository userItemRepository;
    private final UserBoostRepository boostRepository;
    private final RewardLoadoutRepository loadoutRepository;
    private final Clock clock;

    private Random random = new Random();

    public RewardService(
            RewardItemRepository itemRepository,
            RewardOddsRepository oddsRepository,
            StreakMilestoneRepository milestoneRepository,
            UserChestRepository chestRepository,
            UserItemRepository userItemRepository,
            UserBoostRepository boostRepository,
            RewardLoadoutRepository loadoutRepository,
            Clock clock
    ) {
        this.itemRepository = itemRepository;
        this.oddsRepository = oddsRepository;
        this.milestoneRepository = milestoneRepository;
        this.chestRepository = chestRepository;
        this.userItemRepository = userItemRepository;
        this.boostRepository = boostRepository;
        this.loadoutRepository = loadoutRepository;
        this.clock = clock;
    }

    /** Tests swap in a seeded Random. */
    void setRandom(Random random) {
        this.random = random;
    }

    /** Chest tier for a session result, or null when the result earns no chest. */
    static ChestTier tierForPerformance(double performancePercent) {
        if (performancePercent >= 100.0) {
            return ChestTier.GOLD;
        }
        if (performancePercent >= 90.0) {
            return ChestTier.SILVER;
        }
        if (performancePercent >= 75.0) {
            return ChestTier.BRONZE;
        }
        return null;
    }

    // ---- reading ----------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public RewardsResponse get(UUID userId) {
        List<ChestDto> chests = chestRepository.findByUserIdAndOpenedAtIsNullOrderByEarnedAtAsc(userId).stream()
                .map(c -> new ChestDto(c.getId(), c.getTier().name(), c.getSource().name(), c.getEarnedAt()))
                .toList();

        List<UserBoost> unused = boostRepository.findByUserIdAndUsedAtIsNullOrderByCreatedAtAsc(userId);
        BoostDto active = unused.isEmpty() ? null : toBoostDto(unused.get(0));
        List<BoostDto> queued = unused.size() <= 1
                ? List.of()
                : unused.subList(1, unused.size()).stream().map(RewardService::toBoostDto).toList();

        Set<UUID> ownedIds = userItemRepository.findByUserId(userId).stream()
                .map(UserItem::getItemId)
                .collect(Collectors.toSet());

        List<ItemDto> stickers = new ArrayList<>();
        List<ItemDto> skins = new ArrayList<>();
        for (RewardItem item : itemRepository.findAllByOrderByKindAscNameAsc()) {
            boolean owned = ownedIds.contains(item.getId());
            if (!item.isEnabled() && !owned) {
                continue;
            }
            ItemDto dto = new ItemDto(item.getCode(), item.getName(), owned);
            (item.getKind() == RewardKind.SKIN ? skins : stickers).add(dto);
        }

        RewardLoadout loadout = loadoutRepository.findById(userId).orElse(null);
        return new RewardsResponse(
                chests,
                active,
                queued,
                stickers,
                skins,
                loadout == null ? null : loadout.getEquippedSkin(),
                loadout == null ? List.of() : splitStickers(loadout.getEquippedStickers())
        );
    }

    // ---- opening a chest --------------------------------------------------------------------

    @Transactional
    public OpenChestResponse openChest(UUID userId, UUID chestId) {
        UserChest chest = chestRepository.findByIdAndUserId(chestId, userId)
                .orElseThrow(() -> new NotFoundException("Chest not found."));
        if (chest.getOpenedAt() != null) {
            throw new ConflictException("This chest has already been opened.");
        }

        RewardOdds odds = oddsRepository.findById(chest.getTier())
                .orElseThrow(() -> new NotFoundException("Chest odds are not configured."));

        int roll = random.nextInt(100);
        RewardKind wanted = null;
        if (roll < odds.getStickerPct()) {
            wanted = RewardKind.STICKER;
        } else if (roll >= odds.getStickerPct() + odds.getBoostPct()) {
            wanted = RewardKind.SKIN;
        }

        OpenChestResponse response = null;
        boolean exhausted = false;
        if (wanted != null) {
            RewardItem granted = grantRandomItem(userId, wanted);
            if (granted == null) {
                exhausted = true;
            } else {
                String what = wanted == RewardKind.SKIN ? "New mascot skin: " : "New sticker: ";
                response = new OpenChestResponse(wanted.name(), granted.getCode(), granted.getName(),
                        what + granted.getName(), false);
                chest.setResultKind(wanted.name());
                chest.setResultRef(granted.getCode());
            }
        }

        if (response == null) {
            BoostType type = pickBoostType(chest.getTier());
            UserBoost boost = UserBoost.builder()
                    .userId(userId)
                    .type(type)
                    .createdAt(Instant.now(clock))
                    .build();
            boostRepository.save(boost);
            response = new OpenChestResponse("BOOST", type.name(), type.label(),
                    "XP boost: " + type.label() + " on your next session", exhausted);
            chest.setResultKind("BOOST");
            chest.setResultRef(type.name());
        }

        chest.setOpenedAt(Instant.now(clock));
        chestRepository.save(chest);
        return response;
    }

    private RewardItem grantRandomItem(UUID userId, RewardKind kind) {
        Set<UUID> owned = userItemRepository.findByUserId(userId).stream()
                .map(UserItem::getItemId)
                .collect(Collectors.toSet());
        List<RewardItem> available = itemRepository.findByKindAndEnabledTrue(kind).stream()
                .filter(i -> !owned.contains(i.getId()))
                .toList();
        if (available.isEmpty()) {
            return null;
        }
        RewardItem pick = available.get(random.nextInt(available.size()));
        userItemRepository.save(UserItem.builder()
                .userId(userId)
                .itemId(pick.getId())
                .ownedAt(Instant.now(clock))
                .build());
        return pick;
    }

    private BoostType pickBoostType(ChestTier tier) {
        BoostType[] pool = switch (tier) {
            case BRONZE -> new BoostType[]{BoostType.PLUS_5, BoostType.PCT_5};
            case SILVER -> BoostType.values();
            case GOLD -> new BoostType[]{BoostType.PLUS_10, BoostType.PCT_10};
        };
        return pool[random.nextInt(pool.length)];
    }

    // ---- equipping --------------------------------------------------------------------------

    @Transactional
    public RewardsResponse equip(UUID userId, String skin, List<String> stickers) {
        List<String> wanted = stickers == null ? List.of() : stickers;
        if (wanted.size() > MAX_STICKERS) {
            throw new BadRequestException("You can show at most " + MAX_STICKERS + " stickers.");
        }
        if (new HashSet<>(wanted).size() != wanted.size()) {
            throw new BadRequestException("Each sticker can only be shown once.");
        }

        Set<UUID> ownedIds = userItemRepository.findByUserId(userId).stream()
                .map(UserItem::getItemId)
                .collect(Collectors.toSet());

        String skinToStore = null;
        if (skin != null && !skin.isBlank() && !DEFAULT_SKIN.equals(skin)) {
            RewardItem item = itemRepository.findByCode(skin)
                    .filter(i -> i.getKind() == RewardKind.SKIN && ownedIds.contains(i.getId()))
                    .orElseThrow(() -> new BadRequestException("You do not own that skin."));
            skinToStore = item.getCode();
        }

        for (String code : wanted) {
            itemRepository.findByCode(code)
                    .filter(i -> i.getKind() == RewardKind.STICKER && ownedIds.contains(i.getId()))
                    .orElseThrow(() -> new BadRequestException("You do not own the sticker \"" + code + "\"."));
        }

        RewardLoadout loadout = loadoutRepository.findById(userId)
                .orElseGet(() -> RewardLoadout.builder().userId(userId).build());
        loadout.setEquippedSkin(skinToStore);
        loadout.setEquippedStickers(String.join(",", wanted));
        loadoutRepository.save(loadout);
        return get(userId);
    }

    // ---- granting at session completion -----------------------------------------------------

    /**
     * Called inside the session-completion transaction. Grants are keyed by session or by streak run,
     * so a retry can never grant twice. The boost bonus is returned, not added: the caller adds the XP.
     */
    @Transactional
    public SessionRewards onSessionCompleted(
            UUID userId,
            UUID sessionId,
            boolean daily,
            int answeredCount,
            double performancePercent,
            int xpChange,
            int currentStreak
    ) {
        Instant now = Instant.now(clock);
        SessionRewards.ChestEarned chestEarned = null;
        SessionRewards.StreakChest streakChest = null;

        ChestTier tier = tierForPerformance(performancePercent);
        if (answeredCount >= MIN_ANSWERED_FOR_CHEST && tier != null) {
            ChestSource source = daily ? ChestSource.SESSION_DAILY : ChestSource.SESSION_FAST;
            String key = "session:" + sessionId;
            Instant startOfToday = now.truncatedTo(ChronoUnit.DAYS);
            Instant startOfTomorrow = startOfToday.plus(1, ChronoUnit.DAYS);
            boolean alreadyGranted = chestRepository.existsByUserIdAndSourceKey(userId, key);
            long earnedToday = chestRepository.countByUserIdAndSourceAndEarnedAtGreaterThanEqualAndEarnedAtLessThan(
                    userId, source, startOfToday, startOfTomorrow);
            if (!alreadyGranted && earnedToday == 0) {
                UserChest saved = chestRepository.save(newChest(userId, tier, source, key, now));
                chestEarned = new SessionRewards.ChestEarned(saved.getId(), tier.name(), "SESSION");
            }
        }

        if (daily && currentStreak > 0) {
            var milestone = milestoneRepository.findByDaysAndEnabledTrue(currentStreak);
            if (milestone.isPresent()) {
                LocalDate today = LocalDate.now(clock.withZone(ZoneOffset.UTC));
                LocalDate runStart = today.minusDays(currentStreak - 1L);
                String key = "streak:" + currentStreak + ":" + runStart;
                if (!chestRepository.existsByUserIdAndSourceKey(userId, key)) {
                    ChestTier streakTier = milestone.get().getTier();
                    UserChest saved = chestRepository.save(newChest(userId, streakTier, ChestSource.STREAK, key, now));
                    streakChest = new SessionRewards.StreakChest(saved.getId(), streakTier.name(), currentStreak);
                }
            }
        }

        SessionRewards.BoostApplied boost = applyBoost(userId, sessionId, xpChange, now);
        return new SessionRewards(chestEarned, streakChest, boost);
    }

    /**
     * Grants the one Focus chest for a day. Returns null when that day's chest already exists,
     * so a retry can never grant twice.
     */
    @Transactional
    public UserChest grantFocusChest(UUID userId, LocalDate day, ChestTier tier) {
        String key = "focus:" + day;
        if (chestRepository.existsByUserIdAndSourceKey(userId, key)) {
            return null;
        }
        return chestRepository.save(newChest(userId, tier, ChestSource.FOCUS, key, Instant.now(clock)));
    }

    private UserChest newChest(UUID userId, ChestTier tier, ChestSource source, String key, Instant now) {
        return UserChest.builder()
                .userId(userId)
                .tier(tier)
                .source(source)
                .sourceKey(key)
                .earnedAt(now)
                .build();
    }

    /** Uses the oldest waiting boost on a session that gained XP. A losing session leaves it untouched. */
    SessionRewards.BoostApplied applyBoost(UUID userId, UUID sessionId, int xpChange, Instant now) {
        if (xpChange <= 0) {
            return null;
        }
        List<UserBoost> waiting = boostRepository.findByUserIdAndUsedAtIsNullOrderByCreatedAtAsc(userId);
        if (waiting.isEmpty()) {
            return null;
        }
        UserBoost boost = waiting.get(0);
        BoostType type = boost.getType();
        int bonus = type.isPercent()
                ? Math.min(MAX_BOOST_BONUS, Math.max(1, Math.round(xpChange * type.amount() / 100f)))
                : type.amount();
        boost.setUsedAt(now);
        boost.setSessionId(sessionId);
        boostRepository.save(boost);
        return new SessionRewards.BoostApplied(type.label(), bonus);
    }

    // ---- helpers ----------------------------------------------------------------------------

    private static BoostDto toBoostDto(UserBoost boost) {
        return new BoostDto(boost.getId(), boost.getType().name(), boost.getType().label());
    }

    private static List<String> splitStickers(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(",")).filter(s -> !s.isBlank()).toList();
    }
}
