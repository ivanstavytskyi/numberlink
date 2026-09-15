package numberlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Table(name="user_scores")
@Entity(name="Score")
public class ScoreEntity implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "game_token", nullable = false, unique = true)
    private UUID gameToken;

    @Column(name = "score_result", nullable = false)
    private int scoreResult;

    @Column(name = "hints", nullable = false)
    private int hints;

    @Column(name = "elapsed_seconds", nullable = false)
    private int elapsedSeconds;

    @Column(name = "field_width", nullable = false)
    private int fieldWidth;

    @Column(name = "field_height", nullable = false)
    private int fieldHeight;

    @Column(name = "played_at", nullable = false)
    private Instant playedAt;
}
