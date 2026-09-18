package numberlink.service.jpa;

import numberlink.dto.score.response.ScoreHistoryDto;
import numberlink.dto.score.response.ScoreResponseDto;
import numberlink.dto.score.response.ScoreResponseSelfDto;
import numberlink.entity.ScoreEntity;
import numberlink.entity.UserEntity;
import numberlink.exceptions.ScoreException;
import numberlink.repository.ScoreRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Transactional
@Service
public class ScoreServiceJPA implements ScoreService {

    @PersistenceContext
    private EntityManager entityManager;

    private final ScoreRepository scoreRepository;

    public ScoreServiceJPA(ScoreRepository scoreRepository) {
        this.scoreRepository = scoreRepository;
    }

    @Override
    public List<ScoreResponseDto> getTopScoresByCriterion(String criterion, String period, String mapSize)
            throws ScoreException {
        Instant fromDate = null;
        if ("week".equalsIgnoreCase(period)) {
            fromDate = LocalDate.now().minusDays(7).atStartOfDay(ZoneId.systemDefault()).toInstant();
        } else if ("month".equalsIgnoreCase(period)) {
            fromDate = LocalDate.now().minusDays(30).atStartOfDay(ZoneId.systemDefault()).toInstant();
        }

        int width = 0;
        int height = 0;
        if (mapSize != null && mapSize.matches("\\d+x\\d+")) {
            String[] parts = mapSize.toLowerCase().split("x");
            width = Integer.parseInt(parts[0]);
            height = Integer.parseInt(parts[1]);
        }

        boolean hasPeriod = fromDate != null;
        boolean hasSize = width > 0 && height > 0;
        String sort = criterion == null ? "score" : criterion;
        boolean noHintsOnly = "noHints".equalsIgnoreCase(sort)
                || "no-hints".equalsIgnoreCase(sort)
                || "nohints".equalsIgnoreCase(sort);

        StringBuilder jpql = new StringBuilder("""
                SELECT new numberlink.dto.score.response.ScoreResponseDto(
                    u.username,
                    MAX(u.avatarUrl),
                    MIN(s.elapsedSeconds),
                    MAX(s.fieldWidth),
                    MAX(s.fieldHeight),
                    ROUND(AVG(s.elapsedSeconds), 1),
                    ROUND(AVG(s.scoreResult), 1),
                    MAX(s.scoreResult),
                    COALESCE((
                        SELECT MIN(sBest.hints)
                        FROM Score sBest
                        WHERE sBest.user = u
                          AND sBest.scoreResult = (
                              SELECT MAX(sMax.scoreResult)
                              FROM Score sMax
                              WHERE sMax.user = u
                """);
        if (hasPeriod) {
            jpql.append(" AND sMax.playedAt >= :fromDate");
        }
        if (hasSize) {
            jpql.append(" AND sMax.fieldWidth = :width AND sMax.fieldHeight = :height");
        }
        if (noHintsOnly) {
            jpql.append(" AND sMax.hints = 0");
        }
        jpql.append(")");
        if (hasPeriod) {
            jpql.append(" AND sBest.playedAt >= :fromDate");
        }
        if (hasSize) {
            jpql.append(" AND sBest.fieldWidth = :width AND sBest.fieldHeight = :height");
        }
        if (noHintsOnly) {
            jpql.append(" AND sBest.hints = 0");
        }
        jpql.append("""
                    ), 0)
                )
                FROM Score s JOIN s.user u
                WHERE 1 = 1
                """);

        if (hasPeriod) {
            jpql.append(" AND s.playedAt >= :fromDate");
        }
        if (hasSize) {
            jpql.append(" AND s.fieldWidth = :width AND s.fieldHeight = :height");
        }
        if (noHintsOnly) {
            jpql.append(" AND s.hints = 0");
        }

        jpql.append(" GROUP BY u.id, u.username");

        switch (sort) {
            case "avgElapsedSeconds", "avgTime" -> jpql.append(" ORDER BY ROUND(AVG(s.elapsedSeconds), 1) ASC, u.username ASC");
            case "avgScore" -> jpql.append(" ORDER BY ROUND(AVG(s.scoreResult), 1) DESC, u.username ASC");
            default -> jpql.append(" ORDER BY MAX(s.scoreResult) DESC, MIN(s.elapsedSeconds) ASC, u.username ASC");
        }

        TypedQuery<ScoreResponseDto> query =
                entityManager.createQuery(jpql.toString(), ScoreResponseDto.class);

        if (fromDate != null) {
            query.setParameter("fromDate", fromDate);
        }
        if (width > 0 && height > 0) {
            query.setParameter("width", width);
            query.setParameter("height", height);
        }

        return query.setMaxResults(100).getResultList();
    }

    @Override
    @Transactional(readOnly = true)
    public ScoreResponseSelfDto getTopScore(UUID userId, String username) {
        List<Object[]> rows = entityManager.unwrap(Session.class)
                .createNativeQuery("""
                        SELECT
                            ROUND(AVG(s.elapsed_seconds)::numeric, 1) AS avg_duration,
                            ROUND(AVG(s.score_result)::numeric, 1) AS avg_points,
                            MAX(s.score_result) AS max_points,
                            (
                                SELECT COUNT(*) + 1
                                FROM (
                                    SELECT user_id, MAX(score_result) AS best
                                    FROM user_scores
                                    GROUP BY user_id
                                ) rivals
                                WHERE rivals.best > (
                                    SELECT MAX(score_result) FROM user_scores WHERE user_id = :userId
                                )
                            ) AS position,
                            (
                                SELECT s2.hints
                                FROM user_scores s2
                                WHERE s2.user_id = :userId
                                ORDER BY s2.score_result DESC, s2.hints ASC, s2.elapsed_seconds ASC
                                LIMIT 1
                            ) AS hints
                        FROM user_scores s
                        WHERE s.user_id = :userId
                        """, Object[].class)
                .setParameter("userId", userId)
                .getResultList();

        if (rows.isEmpty() || rows.get(0) == null || rows.get(0)[2] == null) {
            ScoreResponseSelfDto empty = new ScoreResponseSelfDto();
            empty.setPlayer(username);
            return empty;
        }

        Object[] row = rows.get(0);
        BigDecimal avgTime = row[0] != null ? new BigDecimal(row[0].toString()) : null;
        BigDecimal avgScore = row[1] != null ? new BigDecimal(row[1].toString()) : null;
        Integer points = row[2] != null ? ((Number) row[2]).intValue() : null;
        Long rank = row[3] != null ? ((Number) row[3]).longValue() : null;
        Integer hints = row[4] != null ? ((Number) row[4]).intValue() : null;

        return new ScoreResponseSelfDto(username, avgTime, avgScore, points, rank, hints);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScoreHistoryDto> getHistory(UUID userId) {
        return scoreRepository.findAllByUser_IdOrderByPlayedAtDesc(userId).stream()
                .limit(500)
                .map(score -> new ScoreHistoryDto(
                        score.getId(),
                        score.getGameToken(),
                        score.getElapsedSeconds(),
                        score.getFieldWidth(),
                        score.getFieldHeight(),
                        score.getScoreResult(),
                        score.getHints(),
                        score.getPlayedAt()
                ))
                .toList();
    }

    @Override
    public ScoreHistoryDto addScore(UserEntity user, int elapsedSeconds, int width, int height, int hints) {
        if (elapsedSeconds < 1) {
            elapsedSeconds = 1;
        }
        if (hints < 0) {
            hints = 0;
        }
        int points = Math.round(10000f / elapsedSeconds);

        ScoreEntity score = new ScoreEntity();
        score.setUser(user);
        score.setElapsedSeconds(elapsedSeconds);
        score.setFieldWidth(width);
        score.setFieldHeight(height);
        score.setHints(hints);
        score.setGameToken(UUID.randomUUID());
        score.setScoreResult(points);
        score.setPlayedAt(Instant.now());
        scoreRepository.save(score);

        ScoreHistoryDto scoreHistoryDto = new ScoreHistoryDto();
        scoreHistoryDto.setGameToken(score.getGameToken());
        scoreHistoryDto.setElapsedSeconds(score.getElapsedSeconds());
        scoreHistoryDto.setFieldWidth(score.getFieldWidth());
        scoreHistoryDto.setFieldHeight(score.getFieldHeight());
        scoreHistoryDto.setHints(score.getHints());
        scoreHistoryDto.setPoints(points);
        scoreHistoryDto.setPlayedAt(score.getPlayedAt());

        return scoreHistoryDto;
    }
}
