package numberlink.repository;

import numberlink.entity.MailTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface MailTokenRepository extends JpaRepository<MailTokenEntity, Long> {

    @Query("""
            select m from MailToken m
            join fetch m.user
            where m.tokenHash = :tokenHash
            """)
    Optional<MailTokenEntity> findByTokenHashWithUser(
            @Param("tokenHash") String tokenHash
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            delete from MailToken m
            where m.user.id = :userId and m.usedAt is null
            """)
    int deleteUnusedByUserId(
            @Param("userId") UUID userId
    );
}
