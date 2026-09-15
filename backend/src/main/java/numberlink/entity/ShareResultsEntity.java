package numberlink.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Setter
@Getter
@Table(name="share_results")
@Entity(name="ShareResults")
public class ShareResultsEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "share_token", nullable = false, unique = true)
    private UUID shareToken;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private ScoreEntity gameId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
