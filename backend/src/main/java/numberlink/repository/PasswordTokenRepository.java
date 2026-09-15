package numberlink.repository;

import numberlink.entity.PasswordTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PasswordTokenRepository extends JpaRepository<PasswordTokenEntity, Long> {

    @Query("""
            select p from PasswordToken p
            join fetch p.user
            where p.tokenHash = :tokenHash
            """)
    Optional<PasswordTokenEntity> findByTokenHashWithUser(
            @Param("tokenHash") String tokenHash
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            delete from PasswordToken p
            where p.user.id = :userId and p.usedAt is null
            """)
    int deleteUnusedByUserId(
            @Param("userId") UUID userId
    );
}
