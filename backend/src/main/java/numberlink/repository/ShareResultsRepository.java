package numberlink.repository;

import numberlink.entity.ShareResultsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShareResultsRepository extends JpaRepository<ShareResultsEntity, Long> {
    @Query("""
            SELECT sr
            FROM ShareResults sr
            JOIN FETCH sr.gameId score
            JOIN FETCH score.user
            WHERE sr.shareToken = :token
            """)
    Optional<ShareResultsEntity> findByShareToken(@Param("token") UUID token);

    @Query("""
        SELECT sr
        FROM ShareResults sr
        JOIN FETCH sr.gameId score
        JOIN FETCH score.user
        WHERE score.gameToken = :token
        """)
    Optional<ShareResultsEntity> findByGameToken(@Param("token") UUID token);
}
