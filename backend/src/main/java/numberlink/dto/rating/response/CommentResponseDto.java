package numberlink.dto.rating.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class CommentResponseDto {
    private String player;
    private String avatarUrl;
    private Integer rating;
    private String comment;
    private Instant commentedOn;
}
