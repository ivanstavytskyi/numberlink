package numberlink.controller;

import numberlink.dto.score.response.ScoreHistoryDto;
import numberlink.entity.UserEntity;
import numberlink.exceptions.RestExceptionHandler;
import numberlink.service.auth.AuthService;
import numberlink.service.jpa.ScoreService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ScoreServiceRestTest {

    @Mock private ScoreService scoreService;
    @Mock private AuthService authService;

    @InjectMocks private ScoreServiceRest scoreServiceRest;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(scoreServiceRest)
                .setControllerAdvice(new RestExceptionHandler())
                .build();
    }

    @Test
    void addScore_whenNoMapInSession_returns400() throws Exception {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setUsername("player");
        when(authService.requireCurrentUser()).thenReturn(user);

        mockMvc.perform(post("/api/score")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"elapsedSeconds":10}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("failed"))
                .andExpect(jsonPath("$.message").value("No active map in session"));
    }

    @Test
    void getHistory_returnsCurrentUserScores() throws Exception {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setUsername("player");
        when(authService.requireCurrentUser()).thenReturn(user);
        when(scoreService.getHistory(user.getId())).thenReturn(List.of(
                new ScoreHistoryDto(12L, UUID.fromString("11111111-1111-1111-1111-111111111111"), 74, 9, 9, 135, 0, Instant.parse("2026-09-13T16:42:00Z"))
        ));

        mockMvc.perform(get("/api/score/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(12))
                .andExpect(jsonPath("$[0].points").value(135))
                .andExpect(jsonPath("$[0].hints").value(0))
                .andExpect(jsonPath("$[0].fieldWidth").value(9))
                .andExpect(jsonPath("$[0].gameToken").value("11111111-1111-1111-1111-111111111111"));
    }
}
